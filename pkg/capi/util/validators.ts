import { Validator, ValidationOptions } from '@shell/utils/validators/formRules';
import { Translation } from '@shell/types/t';
import isEmpty from 'lodash/isEmpty';
import { isIpv4 } from '@shell/utils/string';
import { isValidCIDR, isValidMac } from '@shell/utils/validators/cidr';
import formRulesGenerator from '@shell/utils/validators/formRules/index.ts';
import { CP_VERSIONS } from './../types/capi';

/**
 *
 * @param t this.$store.getters[i18n/t]
 * @param param1 param1.key should be the (already localized) label of the field being validated
 * @param openAPIV3Schema cluster class variable schema.openapiv3schema
 *
 * @returns an array of validator functions that work with the form-validation mixin. These can be supplied to any component wth the labeled-form-element mixin using the rules prop
 */
export const openAPIV3SchemaValidators = function(t: Translation, { key = 'Value' }: ValidationOptions, openAPIV3Schema: any): Validator[] {
  const {
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
    required: requiredFields,
    format
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
    out.push((val: string) => val && val.length > Number(maxLength) ? t('validation.maxLength', { key, max: maxLength }) : undefined);
  }
  if (maxItems) {
    out.push((val: any[]) => val && val.length > maxItems ? t('validation.maxItems', { key, maxItems }) : undefined);
  }

  if (minItems !== undefined) {
    out.push((val: any[]) => val && val.length < minItems ? t('validation.minItems', { key, minItems }) : undefined);
  }

  if (pattern) {
    out.push(regexValidator(t('validation.pattern', { key, pattern }), new RegExp(pattern)));
  }

  if (format && stringFormatValidators(t, { key }, format)) {
    out.push(stringFormatValidators(t, { key }, format));
  }

  if (uniqueItems) {
    out.push((val: any[]) => val && val.filter((item, index) => val.indexOf(item) !== index).length ? t('validation.uniqueItems', { key }) : undefined);
  }

  if (requiredFields) {
    out.push((val: any) => requiredFields.find((key: string) => val[key] === undefined) ? t('validation.requiredFields', { key, requiredFields: requiredFields.toString() }) : undefined);
  }

  return out;
};

const regexValidator = function(errorMessage: string, regexp: RegExp ): Validator {
  return (val: string) => val && !val.match(regexp) ? errorMessage : undefined;
};

// strings can be evaluated against regular expressions by defining 'pattern' or validated against a common set of regexp using 'format'
/**
 *
 * @param t this.$store.getters[i18n/t]
 * @param param1 param1.key should be the (already localized) label of the field being validated
 * @param format one of a set list of string formats defined here https://github.com/kubernetes/apiextensions-apiserver/blob/master/pkg/apiserver/validation/formats.go
 *
 * @returns a form validator for the string format, OR undefined if the format specified is invalid or a format we're not validating for practical reasons
 */
const stringFormatValidators = function(t: Translation, { key = 'Value' }: ValidationOptions, format: string): Validator | undefined {
  const formRules = formRulesGenerator(t, { key } );
  const errorMessage = t('validation.stringFormat', { key, format });

  // there are actually 24 formats in total validated on the backend with some odd options eg ISBN, creditcard
  // this subset of formats are the most universal, which we can be confident we are validating correctly
  switch (format) {
  case 'hostname':
    return (val: string) => formRules.wildcardHostname(val);
  case 'ipv4':
    return (val: string) => val && !isIpv4(val) ? errorMessage : undefined;
  case 'cidr':
    return (val: string) => val && !isValidCIDR(val) ? errorMessage : undefined;
  case 'mac':
    return (val: string) => val && !isValidMac(val) ? errorMessage : undefined;
  case 'uuid':
    return regexValidator(errorMessage, /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i);
  case 'uuid3':
    return regexValidator(errorMessage, /^[0-9a-f]{8}-?[0-9a-f]{4}-?3[0-9a-f]{3}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i);
  case 'uuid4':
    return regexValidator(errorMessage, /^[0-9a-f]{8}-?[0-9a-f]{4}-?4[0-9a-f]{3}-?[89ab][0-9a-f]{3}-?[0-9a-f]{12}$/i);
  case 'uuid5':
    return regexValidator(errorMessage, /^[0-9a-f]{8}-?[0-9a-f]{4}-?5[0-9a-f]{3}-?[89ab][0-9a-f]{3}-?[0-9a-f]{12}$/i);
  case 'port':
    return regexValidator(errorMessage, /^[1-9]+[0-9]*$/i);
  default:
    return undefined;
  }
};

export const isDefined = (val: any) => (val || val === false) || !isEmpty(val);

export const versionTest = function(t: Translation, type: string): RegExp {
  let ending = '';

  if (CP_VERSIONS[type as keyof typeof CP_VERSIONS]) {
    ending = `\\+(${ CP_VERSIONS[type as keyof typeof CP_VERSIONS].join('|') })`;
  }

  return new RegExp(`^v(\\d+.){2}\\d+${ ending }$`);
};

export const versionValidator = function(t: Translation, type: string): Validator[] {
  const out = [] as any[];
  const test = versionTest(t, type);

  out.push((val: String) => val && !val.match(test) ? t('validation.version') : undefined);

  return out;
};

export const nameValidator = function(t: Translation): Validator[] {
  const out = [] as any[];

  out.push((val: String) => !val ? t('validation.name') : undefined);

  return out;
};
