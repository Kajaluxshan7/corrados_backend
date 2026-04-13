import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';
import { UpdateUserDto } from '../auth/dto/update-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly authService: AuthService) {}

  // Any authenticated admin can list users.
  // Super admins see everyone; regular admins see only role=admin users.
  @Get()
  findAll(@Request() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.authService.findAllUsers(req.user.role as string);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.authService.findUserById(id);
  }

  @UseGuards(SuperAdminGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.authService.updateUser(id, updateUserDto);
  }

  @UseGuards(SuperAdminGuard)
  @Patch(':id/toggle-status')
  toggleUserStatus(@Param('id') id: string) {
    return this.authService.toggleUserStatus(id);
  }

  @UseGuards(SuperAdminGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.authService.deleteUser(id);
  }
}
