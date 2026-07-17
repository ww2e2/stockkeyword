export const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character]));

export const toArray = (value) => (Array.isArray(value) ? value : []);

export const serializeJsonLd = (value) =>
  JSON.stringify(value).replace(/</g, '\\u003c');


export const normalizeOptions = (value) =>
  toArray(value).map((item) => (
    typeof item === 'string'
      ? { value: item, label: item }
      : {
          value: item?.value ?? item?.id ?? item?.key ?? '',
          label: item?.label ?? item?.name ?? item?.title ?? item?.value ?? '',
        }
  ));
