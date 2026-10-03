// تبدیل نام یا slug فارسی به slug لاتین؛ همان نگاشتی که API محصول‌ها، کارت محصول و صفحهٔ جزئیات محصول دارند
const persianToLatin = {
  'س': 's', 'ر': 'r', 'د': 'd', 'و': 'oo', 'ز': 'z',
  'آ': 'a', 'ا': 'a', 'ب': 'b', 'پ': 'p', 'ت': 't',
  'ث': 's', 'ج': 'j', 'چ': 'ch', 'ح': 'h', 'خ': 'kh',
  'ذ': 'z', 'ض': 'z', 'ط': 't', 'ظ': 'z', 'ع': 'a',
  'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ک': 'k', 'گ': 'g',
  'ل': 'l', 'م': 'm', 'ن': 'n', 'ه': 'h', 'ی': 'y',
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
};

export function toLatinSlug(input) {
  return input
    .split('')
    .map(char => persianToLatin[char] || char)
    .join('')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');
}

// پارامتر مسیر ممکن است درصدی‌کد شده باشد؛ ورودی خراب (مثل %E0%A4%A) خطا نمی‌دهد و همان برمی‌گردد
export function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
