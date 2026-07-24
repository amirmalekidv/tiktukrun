import {
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreatePlatformFaqDto,
  UpdatePlatformFaqDto,
  UpdatePlatformIntroDto,
} from './dto/platform-intro.dto';
import { PlatformIntroVideoService } from './platform-intro-video.service';

const DEFAULT_TITLE = 'معرفی پلتفرم تیک‌تاک‌ران';
const DEFAULT_FAQ_TITLE = 'سوالات متداول اتاق فرار - اسکیپ روم';

const DEFAULT_FAQS: { question: string; answer: string }[] = [
  {
    question: 'ترسناک‌ترین بازی کدام است؟!',
    answer:
      'بسته به سلیقهٔ شما فرق می‌کند، اما اتاق‌فرارهای با سطح ترس بالا در بخش «اتاق فرار ترسناک» قابل فیلتر و مشاهده هستند. قبل از رزرو، سطح ترس هر بازی را در صفحهٔ جزئیات ببینید.',
  },
  {
    question: 'حداقل و حداکثر تعداد بازیکن چقدر است؟',
    answer:
      'هر بازی ظرفیت مخصوص خودش را دارد (معمولاً ۲ تا ۸ نفر). این عدد در کارت بازی و صفحهٔ جزئیات مشخص شده است.',
  },
  {
    question: 'چطور رزرو کنم؟',
    answer:
      'بازی موردنظر را انتخاب کنید، تاریخ و ساعت را مشخص کنید، تعداد نفرات را وارد کنید و پرداخت را آنلاین انجام دهید. بلیت شما بلافاصله در پنل کاربری‌تان ثبت می‌شود.',
  },
  {
    question: 'آیا امکان لغو یا تغییر رزرو وجود دارد؟',
    answer:
      'بسته به قوانین هر شعبه و زمان باقی‌مانده تا سانس، امکان تغییر یا لغو وجود دارد. جزئیات را در صفحهٔ رزرو یا پشتیبانی بررسی کنید.',
  },
];

function cleanOptionalString(value: string | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

@Injectable()
export class PlatformIntroService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly videoService: PlatformIntroVideoService,
  ) {}

  async onModuleInit() {
    try {
      await this.ensureDefault();
    } catch (err) {
      // DB ممکن است هنگام بوت در دسترس نباشد؛ اولین درخواست دوباره تلاش می‌کند
      console.warn('[PlatformIntro] ensureDefault skipped on boot:', err);
    }
  }

  async ensureDefault() {
    const existing = await this.prisma.platformIntro.findUnique({
      where: { key: 'default' },
      include: { faqs: true },
    });

    if (existing) return existing;

    return this.prisma.platformIntro.create({
      data: {
        key: 'default',
        title: DEFAULT_TITLE,
        faqTitle: DEFAULT_FAQ_TITLE,
        isActive: true,
        faqs: {
          create: DEFAULT_FAQS.map((faq, index) => ({
            question: faq.question,
            answer: faq.answer,
            displayOrder: index,
            isActive: true,
          })),
        },
      },
      include: {
        faqs: { orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }] },
      },
    });
  }

  /** Public payload — only active intro + active FAQs */
  async findPublic() {
    const intro = await this.ensureDefault();
    if (!intro.isActive) return null;

    const faqs = await this.prisma.platformFaq.findMany({
      where: { introId: intro.id, isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        question: true,
        answer: true,
        displayOrder: true,
      },
    });

    return {
      id: intro.id,
      title: intro.title,
      faqTitle: intro.faqTitle,
      videoUrl: intro.videoUrl,
      faqs,
    };
  }

  async findAdmin() {
    const intro = await this.ensureDefault();
    const faqs = await this.prisma.platformFaq.findMany({
      where: { introId: intro.id },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return { ...intro, faqs };
  }

  async update(dto: UpdatePlatformIntroDto, file?: Express.Multer.File) {
    const current = await this.ensureDefault();
    const data: Record<string, unknown> = {};

    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.faqTitle !== undefined) data.faqTitle = dto.faqTitle.trim();
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    let processedVideoUrl: string | undefined;
    const previousVideoUrl = current.videoUrl;

    if (file) {
      processedVideoUrl = await this.videoService.process(file);
      data.videoUrl = processedVideoUrl;
    } else if (dto.clearVideo) {
      data.videoUrl = null;
    } else if (dto.videoUrl !== undefined) {
      data.videoUrl = cleanOptionalString(dto.videoUrl);
    }

    let updated;
    try {
      updated = await this.prisma.platformIntro.update({
        where: { id: current.id },
        data: data as any,
        include: {
          faqs: { orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }] },
        },
      });
    } catch (error) {
      if (processedVideoUrl) this.videoService.delete(processedVideoUrl);
      throw error;
    }

    if (
      data.videoUrl !== undefined &&
      previousVideoUrl &&
      data.videoUrl !== previousVideoUrl
    ) {
      this.videoService.delete(previousVideoUrl);
    }

    return updated;
  }

  async createFaq(dto: CreatePlatformFaqDto) {
    const intro = await this.ensureDefault();
    const displayOrder =
      dto.displayOrder ??
      (await this.prisma.platformFaq.count({ where: { introId: intro.id } }));

    return this.prisma.platformFaq.create({
      data: {
        introId: intro.id,
        question: dto.question.trim(),
        answer: dto.answer.trim(),
        displayOrder,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateFaq(id: string, dto: UpdatePlatformFaqDto) {
    await this.ensureFaq(id);
    const data: Record<string, unknown> = {};
    if (dto.question !== undefined) data.question = dto.question.trim();
    if (dto.answer !== undefined) data.answer = dto.answer.trim();
    if (dto.displayOrder !== undefined) data.displayOrder = dto.displayOrder;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    return this.prisma.platformFaq.update({
      where: { id },
      data: data as any,
    });
  }

  async reorderFaqs(ids: string[]) {
    const intro = await this.ensureDefault();
    await Promise.all(
      ids.map((id, index) =>
        this.prisma.platformFaq.updateMany({
          where: { id, introId: intro.id },
          data: { displayOrder: index },
        }),
      ),
    );
    return this.findAdmin();
  }

  async deleteFaq(id: string) {
    await this.ensureFaq(id);
    return this.prisma.platformFaq.delete({ where: { id } });
  }

  private async ensureFaq(id: string) {
    const faq = await this.prisma.platformFaq.findUnique({ where: { id } });
    if (!faq) throw new NotFoundException('سوال یافت نشد');
    return faq;
  }
}
