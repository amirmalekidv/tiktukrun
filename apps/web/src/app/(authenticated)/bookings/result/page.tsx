'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

/** Wallet charge callback — backend redirects with ?status=success|failed */
function PaymentResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');

  useEffect(() => {
    const statusParam =
      searchParams.get('status') ??
      searchParams.get('Status') ??
      searchParams.get('Authority');

    if (statusParam === 'success' || statusParam === 'OK') {
      setStatus('success');
      toast.success('پرداخت با موفقیت انجام شد!');
    } else if (statusParam === 'failed' || statusParam === 'NOK') {
      setStatus('failed');
    } else if (searchParams.get('Authority')) {
      setStatus('success');
    } else {
      setStatus('failed');
    }
  }, [searchParams]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="dark-card rounded-2xl p-8 border border-red-900/30 bg-[#0d0d0d] text-center max-w-sm w-full"
      >
        {status === 'loading' && (
          <>
            <i className="fas fa-spinner fa-spin text-5xl text-red-600 mb-4" />
            <p className="text-gray-400 font-vazir">در حال تأیید پرداخت...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="w-20 h-20 rounded-full bg-green-900/30 border-2 border-green-600 flex items-center justify-center mx-auto mb-6"
            >
              <i className="fas fa-check text-3xl text-green-500" />
            </motion.div>
            <h2 className="font-cinzel text-xl text-white mb-2">پرداخت موفق!</h2>
            <p className="text-gray-500 font-vazir text-sm mb-6">
              موجودی کیف پول شما بروز شد
            </p>
            <button
              onClick={() => router.push('/wallet')}
              className="w-full py-3 bg-red-800 hover:bg-red-700 text-white font-vazir rounded-xl transition-colors"
            >
              بازگشت به کیف پول
            </button>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="w-20 h-20 rounded-full bg-red-900/30 border-2 border-red-700 flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-times text-3xl text-red-500" />
            </div>
            <h2 className="font-cinzel text-xl text-white mb-2">پرداخت ناموفق</h2>
            <p className="text-gray-500 font-vazir text-sm mb-6">
              تراکنش لغو شد یا با خطا مواجه شد
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/wallet/charge')}
                className="flex-1 py-3 bg-red-800 hover:bg-red-700 text-white font-vazir rounded-xl transition-colors text-sm"
              >
                تلاش مجدد
              </button>
              <button
                onClick={() => router.push('/wallet')}
                className="flex-1 py-3 border border-gray-700 text-gray-400 font-vazir rounded-xl hover:bg-gray-900 transition-colors text-sm"
              >
                بازگشت
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <i className="fas fa-spinner fa-spin text-5xl text-red-600" />
        </div>
      }
    >
      <PaymentResultContent />
    </Suspense>
  );
}
