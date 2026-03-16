import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserRole } from '../common/interfaces/jwt-payload.interface';
import { RabbitPublisher } from '../rabbit/rabbit.publisher';
import { RegisterDto } from './dto/register.dto';
import { User, UserDocument } from './schemas/user.schema';

export interface UserProfileResponse {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: Date;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly rabbitPublisher: RabbitPublisher,
  ) { }

  async createUser(registerDto: RegisterDto, passwordHash: string): Promise<UserDocument> {
    const existingUser = await this.userModel
      .findOne({ email: registerDto.email.toLowerCase() })
      .lean();

    if (existingUser) {
      throw new BadRequestException('Email is already in use');
    }

    const canSetRole = registerDto.role && registerDto.role !== UserRole.User;
    const createdUser = await this.userModel.create({
      email: registerDto.email.toLowerCase(),
      fullName: registerDto.fullName,
      passwordHash,
      role: canSetRole ? registerDto.role : UserRole.User,
    });

    await this.rabbitPublisher.publish('notifications.email', {
      type: 'USER_REGISTERED',
      email: createdUser.email,
      fullName: createdUser.fullName,
      createdAt: new Date().toISOString(),
    });

    return createdUser;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() });
  }

  async getProfile(userId: string): Promise<UserProfileResponse> {
    const user = await this.userModel.findById(userId).lean();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      createdAt: (user as unknown as { createdAt: Date }).createdAt,
    };
  }

  async deleteProfile(userId: string): Promise<void> {
    const deletionResult = await this.userModel.deleteOne({ _id: userId });

    if (deletionResult.deletedCount === 0) {
      throw new NotFoundException('User not found');
    }
  }
}
