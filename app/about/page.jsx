// app/about/page.jsx
import { FaInstagram } from "react-icons/fa";
import Icon from '@mdi/react';
import { mdiInformationOutline, mdiStoreMarkerOutline, mdiCellphoneBasic, mdiPhoneClassic, mdiEmailOutline } from '@mdi/js';
import { MapPinned, Map, UserRoundPlus } from "lucide-react"
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';

export const metadata = {
  title: "درباره ما | فروشگاه ارکیده",
  description: "اطلاعات تماس، آدرس و شبکه‌های اجتماعی فروشگاه ارکیده",
};

export default function AboutPage() {
  return (
    <section className="bg-white py-4 sm:py-6 md:py-12">
      <div className="container mx-auto px-2 sm:px-4 md:px-6">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-1 sm:mb-4 md:mb-7 text-center flex items-center justify-center gap-1">
          <Icon path={mdiInformationOutline} size={1.5} className="mt-1" />
          درباره ما
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
          {/* نقشه محل */}
          <div className="order-1">
            <h3
              dir="rtl"
              className="text-base sm:text-lg md:text-xl font-semibold mb-1 sm:mb-2 flex gap-1"
            >
              <MapPinned className="w-6 h-6" />
              نقشه محل
            </h3>
            <div className="w-full h-48 sm:h-64 md:h-80 lg:h-96 rounded-lg overflow-hidden">
              <iframe
                title="Google Map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3240.395996556202!2d51.36722057543355!3d35.69187167258382!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3f8e012fbb51c6d9%3A0x5586754491f3ff09!2z2obYsdiuINiu24zYp9i324wg2KfYsdqp24zYr9mH!5e0!3m2!1sen!2s!4v1756280931969!5m2!1sen!2s&hl=fa"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>

          {/* آدرس و اطلاعات تماس */}
          <div className="order-2 space-y-2 sm:space-y-3 md:space-y-4" dir="rtl">
            <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-1 sm:mb-2 flex gap-1">
              <Map className="w-6 h-6 mt-1" />
              آدرس و اطلاعات تماس
            </h3>
            <p className="text-sm sm:text-base text-gray-600 flex gap-1">
              <Icon path={mdiStoreMarkerOutline} size={1} />
              آدرس: {" "}
              تهران، قصرالدشت، نرسیده به بوستان سعدی، پ ۴۴۲
            </p>
            <p className="text-sm sm:text-base text-gray-700 gap-1">
              <p className="text-sm sm:text-base text-gray-600 flex gap-1">
                <ContactPhoneIcon className="w-4 h-4" />
               اطلاعات تماس: {" "}
              </p>
             
              <p className="text-sm sm:text-base text-gray-600 flex">
                <Icon path={mdiCellphoneBasic} size={1} />
                <p className="text-sm sm:text-base text-gray-700">تلفن همراه: {" "}
                  <a href="tel:+989122375919" className="text-blue-600 hover:underline">
                    ۰۹۱۲۲۳۷۵۹۱۹
                  </a>
                </p>
              </p>

              <p className="text-sm sm:text-base text-gray-600 flex gap-1">
                <Icon path={mdiPhoneClassic} size={0.8} />
                <p className="text-sm sm:text-base text-gray-700">تلفن فروشگاه: {" "}
                  <a href="tel:02166832625" className="text-blue-600 hover:underline">
                    ۰۲۱۶۶۸۳۲۶۲۵
                  </a>
                </p>
              </p>
              
            </p>

            <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2 flex gap-1">
              <Icon path={mdiEmailOutline} size={1} />
              ایمیل:{" "}
              <a
                href="mailto:poshtibani.orkideh@gmail.com"
                className="text-blue-600 hover:underline"
              >
                poshtibani.orkideh@gmail.com
              </a>
            </p>
          </div>
        </div>

        {/* شبکه‌های اجتماعی */}
        <div className="mt-4 sm:mt-6 md:mt-8 flex flex-col items-center justify-center space-y-3 sm:space-y-4">
          <h3 className="text-base sm:text-lg md:text-xl font-semibold flex gap-1">
            <UserRoundPlus className="w-6 h-6" />
            ما را دنبال کنید
          </h3>
          <div className="flex space-x-3 sm:space-x-4">
            <a
              href="https://instagram.com/orkideh_sewingmachine"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-pink-600"
            >
              <FaInstagram size={27} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}