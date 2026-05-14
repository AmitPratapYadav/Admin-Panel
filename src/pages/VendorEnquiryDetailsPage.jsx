import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Mail, MessageCircle, Phone, Share2 } from 'lucide-react';
import { extractApiError, fetchAdminVendorEnquiry } from '../services/admin';
import { useAdminAuth } from '../context/AdminAuthContext';
import PermissionNotice from '../components/PermissionNotice';

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const sanitizePhone = (value) => (value || '').replace(/[^\d+]/g, '');

const VendorEnquiryDetailsPage = () => {
  const { admin } = useAdminAuth();
  const { id } = useParams();
  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const canView = admin?.role === 'admin' || (admin?.permissions || []).includes('vendors');

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      return;
    }

    const loadInquiry = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await fetchAdminVendorEnquiry(id);
        setInquiry(response?.inquiry || null);
      } catch (err) {
        setError(extractApiError(err, 'Failed to load vendor enquiry details.'));
      } finally {
        setLoading(false);
      }
    };

    loadInquiry();
  }, [canView, id]);

  const whatsappHref = useMemo(() => {
    const phone = sanitizePhone(inquiry?.phone_number);
    if (!phone) return '';
    return `https://wa.me/${phone}`;
  }, [inquiry?.phone_number]);

  const mailHref = inquiry?.email ? `mailto:${inquiry.email}` : '';
  const callHref = inquiry?.phone_number ? `tel:${sanitizePhone(inquiry.phone_number)}` : '';

  if (!canView) {
    return <PermissionNotice message="Your account does not have vendor access." />;
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Vendor Enquiry Details</h1>
        <div className="rounded-xl border border-gray-200 bg-white p-6">Loading enquiry details...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Link to="/vendors/enquiries" className="text-sm font-medium text-[#9BCBBF] hover:underline">
            Back to Vendor Enquiries
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Vendor Enquiry Details</h1>
          <p className="mt-1 text-sm text-gray-500">
            Review the onboarding lead and continue follow-up through WhatsApp, call, or email.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(inquiry?.share_text || '')}`, '_blank', 'noopener,noreferrer')}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Share2 size={15} />
            Share to WhatsApp
          </button>
          {whatsappHref ? (
            <a href={whatsappHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-[#9BCBBF] px-4 py-2 text-sm font-medium text-white hover:opacity-90">
              <MessageCircle size={15} />
              WhatsApp Chat
            </a>
          ) : null}
          {callHref ? (
            <a href={callHref} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              <Phone size={15} />
              Call
            </a>
          ) : null}
          {mailHref ? (
            <a href={mailHref} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              <Mail size={15} />
              Email
            </a>
          ) : null}
        </div>
      </div>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div> : null}

      {inquiry ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Lead Summary</h2>
            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
              {[
                ['Business Name', inquiry.business_name],
                ['Contact Person', inquiry.contact_person_name],
                ['Phone Number', inquiry.phone_number],
                ['Email Address', inquiry.email],
                ['Vendor Type', inquiry.vendor_type],
                ['GST Number', inquiry.gst_number || '-'],
                ['City', inquiry.city],
                ['Pincode', inquiry.pincode],
                ['Monthly Capacity', inquiry.monthly_capacity || '-'],
                ['Received At', formatDateTime(inquiry.created_at)],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
                  <p className="mt-2 text-sm text-gray-900">{value || '-'}</p>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Business Address</p>
              <p className="mt-2 whitespace-pre-line text-sm text-gray-900">{inquiry.address || '-'}</p>
            </div>

            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Primary Categories</p>
              <p className="mt-2 whitespace-pre-line text-sm text-gray-900">{inquiry.primary_categories || '-'}</p>
            </div>

            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Service Areas</p>
              <p className="mt-2 whitespace-pre-line text-sm text-gray-900">{inquiry.service_areas || '-'}</p>
            </div>

            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Additional Notes</p>
              <p className="mt-2 whitespace-pre-line text-sm text-gray-900">{inquiry.requirements || '-'}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
              <div className="mt-5 space-y-3">
                {whatsappHref ? (
                  <a href={whatsappHref} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    <MessageCircle size={18} className="text-[#25D366]" />
                    Open WhatsApp Chat
                  </a>
                ) : null}
                {callHref ? (
                  <a href={callHref} className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    <Phone size={18} className="text-[#9BCBBF]" />
                    Call Vendor Lead
                  </a>
                ) : null}
                {mailHref ? (
                  <a href={mailHref} className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    <Mail size={18} className="text-[#9BCBBF]" />
                    Send Email
                  </a>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">WhatsApp Share Copy</h2>
              <textarea
                readOnly
                value={inquiry.share_text || ''}
                className="mt-4 min-h-[260px] w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-gray-500">
          Vendor enquiry not found.
        </div>
      )}
    </div>
  );
};

export default VendorEnquiryDetailsPage;
