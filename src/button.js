/*
 * Copyright (c) 2024 Eclipse Dirigible contributors
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v2.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-FileCopyrightText: Eclipse Dirigible contributors
 * SPDX-License-Identifier: EPL-2.0
 */
blimpkit.constant('ButtonStates', {
    Emphasized: 'emphasized',
    Transparent: 'transparent',
    Ghost: 'ghost',
    Positive: 'positive',
    Negative: 'negative',
    Attention: 'attention'
}).factory('bkButtonConfig', function (uuid, classNames, ButtonStates) {
    return {
        getConfig: function () {
            return {
                transclude: false,
                require: '?^^bkInputGroupAddon',
                replace: true,
                scope: {
                    label: '@',
                    compact: '<?',
                    badge: '@?',
                    glyph: '@?',
                    glyphRotate: '<?',
                    disabledFocusable: '<?',
                    toggled: '<?',
                    state: '@?',
                    instructions: '@?',
                    isMenu: '<?',
                    arrowDirection: '@?',
                    isOverflow: '<?',
                    isSplit: '<?',
                    inGroup: '<?',
                    inMsgStrip: '<?',
                    nested: '<?',
                    decisive: '<?',
                    round: '<?',
                },
                link: {
                    pre: function (scope) {
                        if (scope.instructions)
                            scope.buttonId = `b${uuid.generate()}`;
                    },
                    post: function (scope, _element, attrs, ctrl) {
                        if (!scope.label && scope.glyph && !attrs.hasOwnProperty('ariaLabel'))
                            console.error('bk-button error: Icon-only buttons must have the "aria-label" attribute');
                        scope.getArrowClass = function () {
                            switch (scope.arrowDirection) {
                                case 'up':
                                    return 'sap-icon--slim-arrow-up';
                                case 'left':
                                    return 'sap-icon--slim-arrow-left';
                                case 'right':
                                    return 'sap-icon--slim-arrow-right';
                                default:
                                    return 'sap-icon--slim-arrow-down';
                            }
                        };
                        scope.getClasses = () => {
                            if (scope.disabledFocusable === true && (!scope.instructions || scope.instructions === '')) {
                                console.error('bk-button error: when using the "focusable disabled" state, you must provide a description using the "instructions" attribute.');
                            }
                            if (ctrl) ctrl.setButtonAddon(true);
                            return classNames('fd-button', {
                                'fd-button--menu': scope.isMenu === true,
                                'fd-button--compact': scope.compact === true,
                                'fd-toolbar__overflow-button': scope.isOverflow === true,
                                'fd-button--emphasized': scope.state === ButtonStates.Emphasized,
                                'fd-button--transparent': scope.state === ButtonStates.Transparent || ctrl,
                                'fd-button--ghost': scope.state === ButtonStates.Ghost,
                                'fd-button--positive': scope.state === ButtonStates.Positive,
                                'fd-button--negative': scope.state === ButtonStates.Negative,
                                'fd-button--attention': scope.state === ButtonStates.Attention,
                                'fd-input-group__button': ctrl && !attrs.hasOwnProperty('bkShellbarButton'),
                                'fd-message-strip__close': scope.inMsgStrip === true,
                                'fd-button--toggled': scope.toggled === true,
                                'is-disabled': scope.disabledFocusable === true,
                                'fd-button--nested': scope.nested === true,
                                'fd-dialog__decisive-button': scope.decisive === true,
                                'bk-button--round': scope.round === true && !scope.label,
                            });
                        };
                        scope.getTextClasses = () => classNames({
                            'fd-button-split__text--compact': scope.compact === true && scope.isSplit === true,
                            'fd-button-split__text': scope.isSplit === true && scope.compact !== true,
                            'fd-button__text': scope.isSplit !== true,
                        });
                    }
                },
                innerTemplate: `<i ng-if="glyph" ng-class="glyph" role="presentation" rotate="{{glyphRotate}}"></i>
                <span ng-if="label" ng-class="getTextClasses()">{{ label }}</span>
                <span ng-if="badge" class="fd-button__badge">{{ badge }}</span>
                <i ng-if="isMenu" ng-class="getArrowClass()"></i>
                <p ng-if="instructions" aria-live="assertive" class="fd-button__instructions" id="{{ uuid }}">{{ instructions }}</p>`,
            };
        }
    };
}).directive('bkButton', function (bkButtonConfig) {
    let buttonConfig = bkButtonConfig.getConfig();
    buttonConfig['restrict'] = 'A';
    buttonConfig['template'] = `<a ng-class="getClasses()"" ng-attr-aria-disabled="{{ disabledFocusable === true ? true : undefined }}" aria-pressed="{{ toggled === true }}" ng-attr-aria-describedby="{{ instructions ? buttonId : undefined }}">${buttonConfig.innerTemplate}</a>`;
    return buttonConfig;
}).directive('bkButton', function (bkButtonConfig) {
    let buttonConfig = bkButtonConfig.getConfig();
    buttonConfig['restrict'] = 'E';
    buttonConfig['template'] = `<button ng-class="getClasses()" ng-attr-aria-disabled="{{ disabledFocusable === true ? true : undefined }}" aria-pressed="{{ toggled === true }}" ng-attr-aria-describedby="{{ instructions ? buttonId : undefined }}">${buttonConfig.innerTemplate}</button>`;
    return buttonConfig;
}).directive('bkSegmentedButton', () => ({
    restrict: 'E',
    transclude: true,
    replace: true,
    link: function (_scope, _element, attrs) {
        if (!attrs.hasOwnProperty('ariaLabel'))
            console.error('bk-segmented-button error: You should provide a description of the group using the "aria-label" attribute');
    },
    template: '<div class="fd-segmented-button" role="group" ng-transclude></div>'
})).directive('bkSplitButton', function (uuid, $window, $injector, backdrop, classNames, ButtonStates) {
    if (!$injector.has('bkPopoverDirective')) {
        console.error('bk-split-button requires the bk-popover widget to be loaded.');
        return {};
    }
    return {
        restrict: 'E',
        transclude: true,
        replace: true,
        scope: {
            mainAction: '@?',
            mainGlyph: '@?',
            compact: '<?',
            glyph: '@?',
            isDisabled: '<?',
            disabledFocusable: '<?',
            instructions: '@?',
            type: '@?',
            callback: '&?',
        },
        controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
            if ($scope.callback) $scope.callback = $scope.callback();
            $scope.popoverId = `sb${uuid.generate()}`;
            this.getPopoverId = function () {
                return $scope.popoverId;
            };

            let toggleBody;

            this.toggleBody = function (toggle) {
                toggleBody = toggle;
            };
            if (!$attrs.hasOwnProperty('ariaLabel'))
                console.error('bk-split-button error: You should provide a description of the split button using the "aria-label" attribute');
            $scope.getSplitClasses = () => classNames('fd-button-split', {
                'fd-button--emphasized': $scope.state === ButtonStates.Emphasized,
                'fd-button--transparent': $scope.state === ButtonStates.Transparent,
                'fd-button--ghost': $scope.state === ButtonStates.Ghost,
                'fd-button--positive': $scope.state === ButtonStates.Positive,
                'fd-button--negative': $scope.state === ButtonStates.Negative,
                'fd-button--attention': $scope.state === ButtonStates.Attention,
            });

            let isHidden = true;
            $scope.pointerHandler = function (e) {
                if (!$element[0].contains(e.target)) {
                    $scope.$apply($scope.hidePopover());
                }
            };
            function focusoutEvent(e) {
                if (e.relatedTarget && !$element[0].contains(e.relatedTarget)) {
                    $scope.$apply($scope.hidePopover);
                }
            }
            function pointerupEvent(e) {
                if (e.originalEvent && e.originalEvent.isSubmenuItem) return;
                else if ($scope.popoverControl && e.target === $scope.popoverControl) return;
                else if ($element[0].contains(e.target) && !isHidden) $scope.hidePopover();
            }
            $element.on('focusout', focusoutEvent);
            $element.on('pointerup', pointerupEvent);

            $scope.mainActionClicked = function () {
                if (!$scope.disabledFocusable && $scope.callback)
                    $scope.callback();
            };

            $scope.hidePopover = function () {
                if ($scope.popoverControl) $scope.popoverControl.setAttribute('aria-expanded', 'false');
                toggleBody(false);
                isHidden = true;
                $window.removeEventListener('pointerup', $scope.pointerHandler);
                backdrop.deactivate();
            };

            $scope.togglePopover = function () {
                if (!$scope.popoverControl) $scope.popoverControl = $element[0].querySelector(`[aria-controls="${$scope.popoverId}"]`);
                if (isHidden) {
                    $scope.popoverControl.setAttribute('aria-expanded', 'true');
                    toggleBody(true);
                    isHidden = false;
                    $window.addEventListener('pointerup', $scope.pointerHandler);
                    backdrop.activate();
                } else {
                    $scope.hidePopover();
                };
            };
            function cleanUp() {
                $element.off('focusout', focusoutEvent);
                $element.off('pointerup', pointerupEvent);
                $window.removeEventListener('pointerup', $scope.pointerHandler);
                backdrop.cleanUp();
            }
            $scope.$on('$destroy', cleanUp);
        }],
        template: `<div class="fd-popover"><div ng-class="getSplitClasses()" role="group">
        <bk-button glyph="{{ mainGlyph }}" label="{{ mainAction }}" ng-disabled="isDisabled" disabled-focusable="disabledFocusable" instructions="instructions" type="{{ type }}" is-split="true" compact="compact || false" ng-click="mainActionClicked()"></bk-button>
        <bk-button glyph="{{ glyph || 'sap-icon--slim-arrow-down' }}" ng-disabled="isDisabled || disabledFocusable" type="{{ type }}" compact="compact || false" aria-label="arrow down" aria-controls="{{ popoverId }}" aria-haspopup="true" aria-expanded="{{ popupExpanded }}" ng-click="togglePopover()"></bk-button>
        </div><bk-popover-body no-arrow="true"><ng-transclude></ng-transclude></bk-popover-body></div>`,
    }
});