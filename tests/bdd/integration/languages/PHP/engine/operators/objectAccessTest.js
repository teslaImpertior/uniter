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
    '../tools',
    '../../tools',
    'js/util'
], function (
    engineTools,
    phpTools,
    util
) {
    'use strict';

    describe('PHP Engine object access operator "->" integration', function () {
        var engine;

        function check(scenario) {
            engineTools.check(function () {
                return {
                    engine: engine
                };
            }, scenario);
        }

        beforeEach(function () {
            engine = phpTools.createEngine();
        });

        util.each({
            'setting previously undefined property of object of stdClass': {
                code: util.heredoc(function (/*<<<EOS
<?php
    $object = new stdClass;

    $object->aProperty = 21;

    var_dump($object);
EOS
*/) {}),
                expectedResult: null,
                expectedStderr: '',
                expectedStdout: util.heredoc(function (/*<<<EOS
object(stdClass)#1 (1) {
  ["aProperty"]=>
  int(21)
}

EOS
*/) {})
            },
            'reading undefined property of object of stdClass': {
                code: util.heredoc(function (/*<<<EOS
<?php
    $object = new stdClass;

    var_dump($object->anUndefinedProperty);
EOS
*/) {}),
                expectedResult: null,
                expectedStderr: 'PHP Notice: Undefined property: stdClass::$anUndefinedProperty',
                expectedStdout: 'NULL\n'
            },
            'setting dynamically referenced property of object with expression for key': {
                code: util.heredoc(function (/*<<<EOS
<?php
    $object = new stdClass;
    $propPrefix = 'my';

    $object->{$propPrefix . 'Name'} = 'Fred';

    var_dump($object);
EOS
*/) {}),
                expectedResult: null,
                expectedStderr: '',
                expectedStdout: util.heredoc(function (/*<<<EOS
object(stdClass)#1 (1) {
  ["myName"]=>
  string(4) "Fred"
}

EOS
*/) {})
            },
            'calling static method as instance method': {
                code: util.heredoc(function (/*<<<EOS
<?php
    class Animal {
        public static function getPlanet() {
            return 'Earth';
        }
    }

    $animal = new Animal();

    return $animal->getPlanet();
EOS
*/) {}),
                expectedResult: 'Earth',
                expectedResultType: 'string',
                // Note that no notices are generated at all
                expectedStderr: '',
                expectedStdout: ''
            }
        }, function (scenario, description) {
            describe(description, function () {
                check(scenario);
            });
        });
    });
});
