/*
 * Uniter - JavaScript PHP interpreter
 * http://asmblah.github.com/uniter/
 *
 * Released under the MIT license
 * https://github.com/asmblah/uniter/raw/master/MIT-LICENSE.txt
 */

/*global define */
define([
    'vendor/esparse/estraverse',
    'js/util'
], function (
    estraverse,
    util
) {
    'use strict';

    var ARGUMENT = 'argument',
        Syntax = estraverse.Syntax;

    function ReturnStatementTranspiler(statementTranspiler, expressionTranspiler) {
        this.expressionTranspiler = expressionTranspiler;
        this.statementTranspiler = statementTranspiler;
    }

    util.extend(ReturnStatementTranspiler.prototype, {
        getNodeType: function () {
            return Syntax.ReturnStatement;
        },

        transpile: function (node, functionContext, blockContext) {
            var expression = this.expressionTranspiler.transpile(node[ARGUMENT], functionContext, blockContext);

            blockContext.prepareStatement().assign({
                'type': Syntax.ReturnStatement,
                'argument': expression
            });
        }
    });

    return ReturnStatementTranspiler;
});