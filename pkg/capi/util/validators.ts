// * format (string)
// * exclusiveMinimum (integer/number)
// * exclusiveMaximum (integer/number)
// * maxItems (array)
// * maxLength (string)
// * maximum (integer/number)
// * minItems (array)
// * minLength (string)
// * minimum (integer/number)
// * pattern (string)
// * uniqueItems (array)
// * required (object)

import { Validator, ValidationOptions } from '@shell/utils/validators/formRules';
import { Translation } from '@shell/types/t';

// const formatPatternMap = {
//   "bsonobjectid", // bson object ID
// 	"uri",          // an URI as parsed by Golang net/url.ParseRequestURI
// 	"email",        // an email address as parsed by Golang net/mail.ParseAddress
// 	"hostname",     // a valid representation for an Internet host name, as defined by RFC 1034, section 3.1 [RFC1034].
// 	"ipv4",         // an IPv4 IP as parsed by Golang net.ParseIP
// 	"ipv6",         // an IPv6 IP as parsed by Golang net.ParseIP
// 	"cidr",         // a CIDR as parsed by Golang net.ParseCIDR
// 	"mac",          // a MAC address as parsed by Golang net.ParseMAC
// 	"uuid":         /(?i)^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/,
// 	"uuid3",        // an UUID3 that allows uppercase defined by the regex (?i)^[0-9a-f]{8}-?[0-9a-f]{4}-?3[0-9a-f]{3}-?[0-9a-f]{4}-?[0-9a-f]{12}$
// 	"uuid4",        // an UUID4 that allows uppercase defined by the regex (?i)^[0-9a-f]{8}-?[0-9a-f]{4}-?4[0-9a-f]{3}-?[89ab][0-9a-f]{3}-?[0-9a-f]{12}$
// 	"uuid5",        // an UUID6 that allows uppercase defined by the regex (?i)^[0-9a-f]{8}-?[0-9a-f]{4}-?5[0-9a-f]{3}-?[89ab][0-9a-f]{3}-?[0-9a-f]{12}$
// 	"isbn",         // an ISBN10 or ISBN13 number string like "0321751043" or "978-0321751041"
// 	"isbn10",       // an ISBN10 number string like "0321751043"
// 	"isbn13",       // an ISBN13 number string like "978-0321751041"
// 	"creditcard":   /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\\d{3})\\d{11})$/,
// 	"ssn",          // a U.S. social security number following the regex ^\\d{3}[- ]?\\d{2}[- ]?\\d{4}$
// 	"hexcolor",     // an hexadecimal color code like "#FFFFFF", following the regex ^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$
// 	"rgbcolor",     // an RGB color code like rgb like "rgb(255,255,2559"
// 	"byte",         // base64 encoded binary data
// 	"password",     // any kind of string
// 	"date",         // a date string like "2006-01-02" as defined by full-date in RFC3339
// 	"duration",     // a duration string like "22 ns" as parsed by Golang time.ParseDuration or compatible with Scala duration format
// 	"datetime",     // a date time string like "2014-12-15T19:30:20.000Z" as defined by date-time in RFC3339
// }

export default function(t: Translation, { key = 'Value' }: ValidationOptions, openAPIV3Schema: any): Validator[] {
  const {
    format,
    exclusiveMinimum,
    exclusiveMaximum,
    maxItems,
    maxLength,
    maximum,
    minItems,
    minLength,
    minimum,
    pattern,
    uniqueItems,
    required: requiredFields
  } = openAPIV3Schema;

  const out = [] as any[];

  if (maximum) {
    if (exclusiveMaximum) {
      out.push((val: string | number) => Number(val) >= Number(maximum) ? t('validation.exclusiveMaxValue', { key, maximum }) : undefined);
    } else {
      out.push((val: string | number) => Number(val) > Number(maximum) ? t('validation.maxValue', { key, max: maximum }) : undefined);
    }
  }

  if (minimum !== undefined) {
    if (exclusiveMinimum) {
      out.push((val: string | number) => Number(val) <= Number(minimum) ? t('validation.exclusiveMinValue', { key, minimum }) : undefined);
    } else {
      out.push((val: string | number) => Number(val) < Number(minimum) ? t('validation.minValue', { key, min: minimum }) : undefined);
    }
  }
  if (minLength !== undefined) {
    out.push((val: string) => val && val.length < Number(minLength) ? t('validation.minLength', { key, min: minLength }) : undefined);
  }
  if (maxLength) {
    out.push((val: string) => val && val.length > Number(maxLength) ? t('validation.minLength', { key, max: maxLength }) : undefined);
  }
  if (maxItems) {
    out.push((val: any[]) => val && val.length > maxItems ? t('validation.maxItems', { key, maxItems }) : undefined);
  }

  if (minItems !== undefined) {
    out.push((val: any[]) => val && val.length < minItems ? t('validation.minItems', { key, minItems }) : undefined);
  }

  if (pattern) {
    out.push((val: string) => val && !val.match(new RegExp(pattern)) ? t('validation.pattern', { key, pattern }) : undefined);
  }

  if (uniqueItems) {
    out.push((val: any[]) => val && val.filter((item, index) => val.indexOf(item) !== index).length ? t('validation.uniqueItems', { key }) : undefined);
  }

  if (requiredFields) {
    out.push((val: any) => requiredFields.find((key: string) => val[key] === undefined) ? t('validation.requiredFields', { key, requiredFields: requiredFields.toString() }) : undefined);
  }

  return out;
}
