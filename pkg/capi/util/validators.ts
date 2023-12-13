import { Validator, ValidationOptions } from '@shell/utils/validators/formRules';
import { Translation } from '@shell/types/t';
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
};
