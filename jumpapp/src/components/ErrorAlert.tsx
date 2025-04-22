import Link from 'next/link';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ErrorAlertProps {
  title: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
}

export default function ErrorAlert({
  title,
  message,
  actionLabel,
  actionHref,
}: ErrorAlertProps) {
  return (
    <div className="rounded-md bg-red-50 p-4 border border-red-200">
      <div className="flex">
        <div className="flex-shrink-0">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">{title}</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{message}</p>
          </div>
          {actionLabel && actionHref && (
            <div className="mt-4">
              <Link
                href={actionHref}
                className="inline-flex items-center rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
              >
                {actionLabel}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 