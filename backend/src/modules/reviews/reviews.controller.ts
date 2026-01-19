import { Controller, Get, Post, Body, Query, UseGuards, Patch, Delete, Param } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Criar uma nova avaliação (apenas se elegível)' })
  create(@Body() createReviewDto: CreateReviewDto) {
    return this.reviewsService.create(createReviewDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar avaliações do tenant' })
  @ApiQuery({ name: 'tenantId', required: true })
  findAll(@Query('tenantId') tenantId: string) {
    return this.reviewsService.findAll(tenantId);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Listar avaliações em destaque do tenant' })
  @ApiQuery({ name: 'tenantId', required: true })
  findFeatured(@Query('tenantId') tenantId: string) {
    return this.reviewsService.findFeatured(tenantId);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Atualizar avaliação (admin)' })
  update(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string,
    @Body() body: { rating?: number; comment?: string; isFeatured?: boolean },
  ) {
    return this.reviewsService.update(id, tenantId, body);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Excluir avaliação (admin)' })
  remove(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string,
  ) {
    return this.reviewsService.remove(id, tenantId);
  }
}
