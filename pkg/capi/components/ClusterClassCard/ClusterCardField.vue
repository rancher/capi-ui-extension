<script>
export default {
  props: {
    name: {
      type:     String,
      required: true
    },
    value: {
      type:    [Number, String, undefined],
      default: ''
    }
  }
};
</script>

<template>
  <div class="label">
    <div class="text-label">
      <slot name="name">
        {{ name }}
      </slot>
    </div>

    <div class="value">
      <slot name="value">
        {{ value }}
      </slot>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.label {
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;

  .text-label {
    font-family: 'Lato';
    font-size: 12px;
    font-style: normal;
    font-weight: normal;
    line-height: $input-line-height;
    color: #6C6C76;
  }

  .value {
    font-family: 'Lato';
    font-size: 14px;
    color: black;
    font-style: normal;
    font-weight: normal;
    line-height: $input-line-height;
  }
}
</style>
