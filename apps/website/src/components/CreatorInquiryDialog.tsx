import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Input,
  Textarea,
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  useToast,
} from '@kstorybridge/ui';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { sendSlackNotification } from '../utils/slack';
import { supabase } from '@/integrations/supabase/client';

interface CreatorInquiryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Design-system styling. The shared shadcn semantic tokens (bg-background, etc.)
// resolve incorrectly in this app, so form controls are styled explicitly:
// white surface, gray-300 borders, coral focus ring (creator surface).
const FIELD_CLASS =
  'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus-visible:ring-sunrise-coral focus-visible:border-sunrise-coral';
const LABEL_CLASS = 'text-gray-700';

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const buildInquiryEmailHtml = (values: {
  name?: string;
  email?: string;
  company?: string;
  titleName?: string;
  titleUrl?: string;
  role?: string;
  specialRequest?: string;
}) => {
  // Form values are attacker-controlled; escape every interpolation to prevent
  // HTML injection in the email body. Labels are trusted static strings.
  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:8px 12px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:600;white-space:nowrap;">${label}</td>
      <td style="padding:8px 12px;border:1px solid #e5e7eb;">${escapeHtml(value) || '—'}</td>
    </tr>`;

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111827;">
      <h2 style="margin:0 0 16px;">New Creator Inquiry</h2>
      <table style="border-collapse:collapse;width:100%;max-width:640px;">
        ${row('Name', values.name || '')}
        ${row('Email', values.email || '')}
        ${row('Company / Studio', values.company || '')}
        ${row('Title', values.titleName || '')}
        ${row('Title URL', values.titleUrl || '')}
        ${row('Role', values.role || '')}
        ${row('Special request', values.specialRequest || '')}
      </table>
    </div>`;
};

const CreatorInquiryDialog = ({ open, onOpenChange }: CreatorInquiryDialogProps) => {
  const { t } = useTranslation('creators');
  const { toast } = useToast();

  const inquirySchema = z.object({
    name: z.string().min(2, { message: t('inquiry.validation.name') }),
    email: z.string().email({ message: t('inquiry.validation.email') }),
    company: z.string().optional(),
    titleName: z.string().min(1, { message: t('inquiry.validation.titleName') }),
    titleUrl: z.string().url({ message: t('inquiry.validation.titleUrl') }),
    role: z.enum(['author', 'agent'], {
      required_error: t('inquiry.validation.role'),
    }),
    specialRequest: z.string().optional(),
  });

  type InquiryValues = z.infer<typeof inquirySchema>;

  const form = useForm<InquiryValues>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      name: '',
      email: '',
      company: '',
      titleName: '',
      titleUrl: '',
      role: undefined,
      specialRequest: '',
    },
  });

  // Reset the form whenever the dialog closes (it stays mounted on the page),
  // so stale input and validation errors don't reappear on reopen.
  const handleOpenChange = (next: boolean) => {
    if (!next) form.reset();
    onOpenChange(next);
  };

  const onSubmit = async (values: InquiryValues) => {
    try {
      // Send the email first (this is the call that can fail). Only notify Slack
      // after it succeeds, so a failed submit + retry can't duplicate the Slack ping.
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to: 'support@kstorybridge.com',
          replyTo: values.email,
          subject: `New Creator Inquiry: ${values.titleName}`,
          html: buildInquiryEmailHtml(values),
        },
      });

      if (error) throw error;

      await sendSlackNotification({
        event: 'Creator Inquiry (Contact Form)',
        userType: 'creator',
        fullName: values.name,
        email: values.email,
        company: values.company || undefined,
        additionalInfo: {
          role: values.role,
          title: values.titleName,
          title_url: values.titleUrl,
          special_request: values.specialRequest || 'None',
          source: 'creators_page_contact_form',
        },
      });

      toast({
        className:
          'bg-white border border-gray-200 border-l-4 border-l-sunrise-coral rounded-2xl text-gray-900',
        // Radix Toast.Root's HTML `title` attr collides with the ReactNode override,
        // so the title type narrows to string; cast to allow rich content.
        title: ((
          <span className="flex items-center gap-2 text-black">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-sunrise-coral" />
            {t('inquiry.toast.successTitle')}
          </span>
        ) as unknown) as string,
        description: (
          <span className="text-gray-600">{t('inquiry.toast.successDescription')}</span>
        ),
      });
      form.reset();
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to send creator inquiry:', err);
      toast({
        className:
          'bg-white border border-gray-200 border-l-4 border-l-red-500 rounded-2xl text-gray-900',
        title: ((
          <span className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            {t('inquiry.toast.errorTitle')}
          </span>
        ) as unknown) as string,
        description: (
          <span className="text-gray-600">{t('inquiry.toast.errorDescription')}</span>
        ),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/60" />
      </DialogPortal>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-gray-200 bg-white sm:max-w-lg sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-black">{t('inquiry.title')}</DialogTitle>
          <DialogDescription className="text-gray-600">{t('inquiry.description')}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={LABEL_CLASS}>{t('inquiry.fields.name.label')}</FormLabel>
                  <FormControl>
                    <Input className={FIELD_CLASS} placeholder={t('inquiry.fields.name.placeholder')} {...field} />
                  </FormControl>
                  <FormMessage className="text-red-600" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={LABEL_CLASS}>{t('inquiry.fields.email.label')}</FormLabel>
                  <FormControl>
                    <Input type="email" className={FIELD_CLASS} placeholder={t('inquiry.fields.email.placeholder')} {...field} />
                  </FormControl>
                  <FormMessage className="text-red-600" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={LABEL_CLASS}>{t('inquiry.fields.company.label')}</FormLabel>
                  <FormControl>
                    <Input className={FIELD_CLASS} placeholder={t('inquiry.fields.company.placeholder')} {...field} />
                  </FormControl>
                  <FormDescription className="text-gray-500">{t('inquiry.fields.company.helper')}</FormDescription>
                  <FormMessage className="text-red-600" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="titleName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={LABEL_CLASS}>{t('inquiry.fields.titleName.label')}</FormLabel>
                  <FormControl>
                    <Input className={FIELD_CLASS} placeholder={t('inquiry.fields.titleName.placeholder')} {...field} />
                  </FormControl>
                  <FormMessage className="text-red-600" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="titleUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={LABEL_CLASS}>{t('inquiry.fields.titleUrl.label')}</FormLabel>
                  <FormControl>
                    <Input type="url" className={FIELD_CLASS} placeholder={t('inquiry.fields.titleUrl.placeholder')} {...field} />
                  </FormControl>
                  <FormMessage className="text-red-600" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={LABEL_CLASS}>{t('inquiry.fields.role.label')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ''}>
                    <FormControl>
                      <SelectTrigger className={`${FIELD_CLASS} data-[placeholder]:text-gray-400`}>
                        <SelectValue placeholder={t('inquiry.fields.role.placeholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white border-gray-200">
                      <SelectItem value="author" className="text-gray-900">
                        {t('inquiry.fields.role.author')}
                      </SelectItem>
                      <SelectItem value="agent" className="text-gray-900">
                        {t('inquiry.fields.role.agent')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-600" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="specialRequest"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={LABEL_CLASS}>{t('inquiry.fields.specialRequest.label')}</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      className={FIELD_CLASS}
                      placeholder={t('inquiry.fields.specialRequest.placeholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-600" />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-full border-gray-300 bg-white px-6 text-black hover:bg-gray-100"
                onClick={() => handleOpenChange(false)}
                disabled={form.formState.isSubmitting}
              >
                {t('inquiry.cancel')}
              </Button>
              <Button
                type="submit"
                className="rounded-full bg-sunrise-coral px-6 text-white shadow-sm hover:bg-sunrise-coral-600"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? t('inquiry.submitting') : t('inquiry.submit')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatorInquiryDialog;
