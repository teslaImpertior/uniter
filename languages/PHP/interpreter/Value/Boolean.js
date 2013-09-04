/*
 * Uniter - JavaScript PHP interpreter
 * Copyright 2013 Dan Phillimore (asmblah)
 * http://asmblah.github.com/uniter/
 *
 * Released under the MIT license
 * https://github.com/asmblah/uniter/raw/master/MIT-LICENSE.txt
 */

/*global define */
define([
    'js/util',
    '../Error/Fatal',
    '../Value'
], function (
    util,
    PHPFatalError,
    Value
) {
    'use strict';

    function BooleanValue(factory, value) {
        Value.call(this, factory, 'boolean', value);
    }

    util.inherit(BooleanValue).from(Value);

    util.extend(BooleanValue.prototype, {
        coerceToBoolean: function () {
            return this;
        },

        coerceToInteger: function () {
            var value = this;

            return value.factory.createInteger(value.value ? 1 : 0);
        },

        coerceToString: function () {
            var value = this;

            return value.factory.createString(value.value ? '1' : '');
        },

        onesComplement: function () {
            throw new PHPFatalError(PHPFatalError.UNSUPPORTED_OPERAND_TYPES);
        },

        shiftLeftBy: function (rightValue) {
            return this.coerceToInteger().shiftLeftBy(rightValue);
        }
    });

    return BooleanValue;
});
