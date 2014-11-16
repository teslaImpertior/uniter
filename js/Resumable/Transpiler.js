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
    'vendor/esparse/esprima',
    'vendor/esparse/estraverse',
    'js/util'
], function (
    esprima,
    estraverse,
    util
) {
    'use strict';

    var Syntax = estraverse.Syntax;

    function Transpiler() {

    }

    util.extend(Transpiler.prototype, {
        transpile: function (ast) {
            var assignmentStatements = {},
                assignmentStatementsStack = [],
                enter,
                nextTempIndex = 0,
                nextTempIndexStack = [],
                switchCases = [],
                stack = [],
                variables = [],
                variablesStack = [],
                variablesToTemps = [],
                variablesToTempsStack = [];

            function addSwitchCase(statement) {
                switchCases.push({
                    type: Syntax.SwitchCase,
                    test: {
                        type: Syntax.Literal,
                        value: switchCases.length
                    },
                    consequent: [
                        esprima.parse('++statementIndex').body[0],
                        statement
                    ]
                });
            }

            function handleStatements(statements) {
                var assignmentProperties = [],
                    declaration,
                    index,
                    stateProperties = [],
                    stateSetup,
                    tryBlockBody = [];

                if (statements.length === 0) {
                    return [];
                }

                stack.push(switchCases);
                switchCases = [];

                util.each(statements, function (statement) {
                    addSwitchCase(estraverse.replace(statement, {
                        'enter': enter
                    }));
                });

                util.each(variables, function (name) {
                    stateProperties.push({
                        type: Syntax.Property,
                        kind: 'init',
                        key: {
                            type: Syntax.Identifier,
                            name: name
                        },
                        value: {
                            type: Syntax.Identifier,
                            name: name
                        }
                    });
                });

                declaration = esprima.parse('var statementIndex = 0;').body[0];
                stateSetup = esprima.parse('if (Resumable._resumeState_) { statementIndex = Resumable._resumeState_.statementIndex; }').body[0];

                for (index = 0; index < nextTempIndex; index++) {
                    stateProperties.push({
                        type: Syntax.Property,
                        kind: 'init',
                        key: {
                            type: Syntax.Identifier,
                            name: 'temp' + index
                        },
                        value: {
                            type: Syntax.Identifier,
                            name: 'temp' + index
                        }
                    });

                    declaration.declarations.push({
                        type: Syntax.VariableDeclarator,
                        id: {
                            type: Syntax.Identifier,
                            name: 'temp' + index
                        },
                        init: null
                    });

                    stateSetup.consequent.body.push({
                        type: Syntax.ExpressionStatement,
                        expression: {
                            type: Syntax.AssignmentExpression,
                            operator: '=',
                            left: {
                                type: Syntax.Identifier,
                                name: 'temp' + index,
                            },
                            right: esprima.parse('Resumable._resumeState_.temp' + index).body[0].expression
                        }
                    });
                }

                stateSetup.consequent.body.push(esprima.parse('Resumable._resumeState_ = null;').body[0]);

                util.each(assignmentStatements, function (variableName, statementIndex) {
                    assignmentProperties.push({
                        type: Syntax.Property,
                        kind: 'init',
                        key: {
                            type: Syntax.Literal,
                            value: statementIndex
                        },
                        value: {
                            type: Syntax.Literal,
                            value: variableName
                        }
                    });
                }, {keys: true});

                tryBlockBody.push({
                    type: Syntax.SwitchStatement,
                    discriminant: {
                        type: Syntax.Identifier,
                        name: 'statementIndex'
                    },
                    cases: switchCases
                });

                switchCases = stack.pop();

                return [
                    declaration,
                    stateSetup,
                    {
                        type: Syntax.TryStatement,
                        block: {
                            type: Syntax.BlockStatement,
                            body: tryBlockBody
                        },
                        handler: {
                            type: Syntax.CatchClause,
                            param: {
                                type: Syntax.Identifier,
                                name: 'e'
                            },
                            body: {
                                type: Syntax.BlockStatement,
                                body: [
                                    {
                                        type: Syntax.IfStatement,
                                        test: esprima.parse('e instanceof Resumable.PauseException').body[0].expression,
                                        consequent: {
                                            type: Syntax.BlockStatement,
                                            body: [
                                                {
                                                    type: Syntax.ExpressionStatement,
                                                    expression: {
                                                        type: Syntax.CallExpression,
                                                        callee: {
                                                            type: Syntax.MemberExpression,
                                                            object: {
                                                                type: Syntax.Identifier,
                                                                name: 'e'
                                                            },
                                                            property: {
                                                                type: Syntax.Identifier,
                                                                name: 'add'
                                                            },
                                                            computed: false
                                                        },
                                                        arguments: [
                                                            {
                                                                type: Syntax.ObjectExpression,
                                                                properties: [
                                                                    {
                                                                        type: Syntax.Property,
                                                                        kind: 'init',
                                                                        key: {
                                                                            type: Syntax.Identifier,
                                                                            name: 'func'
                                                                        },
                                                                        value: {
                                                                            type: Syntax.MemberExpression,
                                                                            object: {
                                                                                type: Syntax.Identifier,
                                                                                name: 'arguments'
                                                                            },
                                                                            property: {
                                                                                type: Syntax.Identifier,
                                                                                name: 'callee'
                                                                            },
                                                                            computed: false
                                                                        }
                                                                    },
                                                                    {
                                                                        type: Syntax.Property,
                                                                        kind: 'init',
                                                                        key: {
                                                                            type: Syntax.Identifier,
                                                                            name: 'statementIndex'
                                                                        },
                                                                        value: {
                                                                            type: Syntax.Identifier,
                                                                            name: 'statementIndex'
                                                                        }
                                                                    },
                                                                    {
                                                                        type: Syntax.Property,
                                                                        kind: 'init',
                                                                        key: {
                                                                            type: Syntax.Identifier,
                                                                            name: 'assignments'
                                                                        },
                                                                        value: {
                                                                            type: Syntax.ObjectExpression,
                                                                            properties: assignmentProperties
                                                                        }
                                                                    }
                                                                ].concat(stateProperties)
                                                            }
                                                        ]
                                                    }
                                                }
                                            ]
                                        }
                                    },
                                    {
                                        type: Syntax.ThrowStatement,
                                        argument: {
                                            type: Syntax.Identifier,
                                            name: 'e'
                                        }
                                    }
                                ]
                            }
                        }
                    }
                ];
            }

            enter = function enter(node, parent) {
                var body,
                    tempName;

                if (node.type === Syntax.FunctionDeclaration || node.type === Syntax.FunctionExpression) {
                    this.skip();

                    variablesStack.push(variables);
                    variables = [];
                    variablesToTempsStack.push(variablesToTemps);
                    variablesToTemps = [];
                    nextTempIndexStack.push(nextTempIndex);
                    nextTempIndex = 0;
                    assignmentStatementsStack.push(assignmentStatements);
                    assignmentStatements = {};

                    util.each(node.params, function (param) {
                        variables.push(param.name);
                    });

                    body = handleStatements(node.body.body);

                    variables = variablesStack.pop();
                    variablesToTemps = variablesToTempsStack.pop();
                    nextTempIndex = nextTempIndexStack.pop();
                    assignmentStatements = assignmentStatementsStack.pop();

                    return {
                        type: node.type,
                        id: node.id,
                        params: node.params,
                        body: {
                            type: Syntax.BlockStatement,
                            body: body
                        }
                    };
                }

                if (node.type === Syntax.Identifier && /(Binary|Member|Unary)Expression$/.test(parent.type)) {
                    if (parent.type !== Syntax.MemberExpression || node !== parent.property) {
                        if (variablesToTemps[node.name]) {
                            tempName = variablesToTemps[node.name];
                        } else {
                            tempName = 'temp' + nextTempIndex++;
                            variablesToTemps[node.name] = tempName;

                            assignmentStatements[switchCases.length] = tempName;

                            addSwitchCase({
                                type: Syntax.ExpressionStatement,
                                expression: {
                                    type: Syntax.AssignmentExpression,
                                    operator: '=',
                                    left: {
                                        type: Syntax.Identifier,
                                        name: tempName
                                    },
                                    right: node
                                }
                            });
                        }

                        return {
                            type: Syntax.Identifier,
                            name: tempName
                        };
                    }
                }

                if (node.type === Syntax.CallExpression) {
                    tempName = 'temp' + nextTempIndex++;

                    assignmentStatements[switchCases.length] = tempName;

                    addSwitchCase({
                        type: Syntax.ExpressionStatement,
                        expression: {
                            type: Syntax.AssignmentExpression,
                            operator: '=',
                            left: {
                                type: Syntax.Identifier,
                                name: tempName
                            },
                            right: node
                        }
                    });

                    return {
                        type: Syntax.Identifier,
                        name: tempName
                    };
                }

                if (parent.type === Syntax.ExpressionStatement && node.type === Syntax.AssignmentExpression) {
                    if (node.operator !== '=') {
                        return {
                            type: Syntax.AssignmentExpression,
                            operator: '=',
                            left: node.left,
                            right: {
                                type: Syntax.BinaryExpression,
                                operator: node.operator.charAt(0),
                                left: node.left,
                                right: node.right
                            }
                        };
                    }
                }

                if (node.type === Syntax.VariableDeclarator) {
                    variables.push(node.id.name);

                    return;
                }
            };

            return {
                type: Syntax.Program,
                body: [
                    {
                        type: Syntax.ExpressionStatement,
                        expression: {
                            type: Syntax.FunctionExpression,
                            id: null,
                            params: [],
                            body: {
                                type: Syntax.BlockStatement,
                                body: handleStatements(ast.body)
                            }
                        }
                    }
                ]
            };
        }
    });

    return Transpiler;
});