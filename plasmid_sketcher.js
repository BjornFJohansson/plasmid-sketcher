/*

    Copyright (c) 2018 Eliane Briand

    This file is part of Plasmid Sketcher.

    Plasmid sketcher is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.



    This project incorporates work covered by the following copyright and permission notice :

    The MIT License (MIT)

    Copyright (c) 2014 Rehan Chawdry <rchawdry@vixis.com>

    Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 */


angular.module("app", ["angularplasmid"]);

angular.module("angularplasmid.services", [])

         .factory("SVGUtil", function () {
            /*
                PUBLIC API
                -----------------------------------------------------------------------
                api - API for working with AngularPlasmid objects on a page
                util - General utilities
                svg - SVG node, path calculations
            */

            var plasmids = [], tracks = [], markers = [];

            // Decimal round with precision
            function round10(value, exp) {
                var type = 'round';
                // If the exp is undefined or zero...
                if (typeof exp === 'undefined' || +exp === 0) {
                    return Math[type](value);
                }
                value = +value;
                exp = +exp;
                // If the value is not a number or the exp is not an integer...
                if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
                    return NaN;
                }
                // Shift
                value = value.toString().split('e');
                value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
                // Shift back
                value = value.toString().split('e');
                return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
            }

            function addPlasmid(plasmid) {
                plasmids.push(plasmid);
            }
             
            function plasmid(id) {
                var i;
                for (i = 0; i < plasmids.length; i += 1) {
                    if (plasmids[i].id === id) {
                        return plasmids[i];
                    }
                }
            }
             
            function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
                var angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
                return {
                    x: centerX + (radius * Math.cos(angleInRadians)),
                    y: centerY + (radius * Math.sin(angleInRadians))
                };
            }

            function swapProperties(elemFrom, elemTo) {
                var property, fromProp, i,
                    PROPLIST = ['id', 'name', 'class', 'style', 'filter', 'ng-attr-style', 'ng-attr-class','ng-class'];

                for (i = 0; i < PROPLIST.length; i += 1) {
                    property = PROPLIST[i];
                    if (elemFrom[0].hasAttribute(property)) {
                        elemTo.attr(property, elemFrom.attr(property));
                        elemFrom.removeAttr(property);
                    }
                }
            }

            function createNode(name, settings, excludeSettings) {
                var namespace = 'http://www.w3.org/2000/svg',
                    node = document.createElementNS(namespace, name),
                    attribute,
                    value;

                excludeSettings = excludeSettings || [];
                angular.forEach(settings, function (attribute) {
                    if (excludeSettings.indexOf(attribute) < 0) {
                        value = settings[attribute];
                        if (value !== null && !attribute.match(/\$/) && (typeof value !== 'string' || value !== '')) {
                            node.setAttribute(attribute, value);
                        }
                    }
                });
                return node;
            }

            function removeAttributes(element) {
                angular.forEach(['id', 'class', 'style'], function (a) {
                    element.removeAttribute(a);
                });
            }

            function pathDonut(x, y, radius, width) {
                var innerRing, outerRing, path;

                x = Number(x || 0);
                y = Number(y || 0);
                radius = Number(radius || 0);
                width = Number(width || 0);

                innerRing = {
                    start : polarToCartesian(x, y, radius, 359.99),
                    end : polarToCartesian(x, y, radius, 0)
                };

                outerRing = {
                    start : polarToCartesian(x, y, radius + width, 359.99),
                    end : polarToCartesian(x, y, radius + width, 0)
                };

                path = [    "M", innerRing.start.x, innerRing.start.y,
                                "A", radius, radius, 0, 1, 0, innerRing.end.x, innerRing.end.y,
                                "M", outerRing.start.x, outerRing.start.y,
                                "A", radius + width, radius + width, 0, 1, 0, outerRing.end.x, outerRing.end.y
                            ].join(" ");

                return path;
            }

            function pathArc(x, y, radius, startAngle, endAngle, width, arrowStart, arrowEnd) {
                var d, start, start2, end, arcSweep, arrow_start_1, arrow_start_2, arrow_start_3, arrow_start_4, arrow_end_1, arrow_end_2, arrow_end_3, arrow_end_4;

                x = Number(x);
                y = Number(y);
                radius = Number(radius);
                startAngle = Number(startAngle);
                endAngle = Number(endAngle);
                width = Number(width);
                arrowStart = arrowStart || {width : 0, length : 0, angle: 0};
                arrowEnd = arrowEnd || {width : 0, length : 0, angle: 0};

                if (startAngle === endAngle) {
                    // Draw a line
                    start = polarToCartesian(x, y, radius, startAngle);
                    end = polarToCartesian(x, y, radius + width, startAngle);
                    d = ["M", start.x, start.y, "L", end.x, end.y].join(" ");
                } else {
                    //Draw a "simple" arc if the width is 1
                    if (width === 1) {
                        start = polarToCartesian(x, y, radius, startAngle);
                        end = polarToCartesian(x, y, radius, endAngle);
                        if (startAngle < endAngle) {
                            arcSweep = endAngle - startAngle <= 180 ? "0" : "1";
                        } else {
                            arcSweep = endAngle - startAngle <= 180 ? "1" : "0";
                        }
                        d = ["M", start.x, start.y, "A", radius, radius, 0, arcSweep, 1, end.x, end.y].join(" ");
                    } else {

                        // Draw a "complex" arc (We start drawing in reverse, which is why start uses endAngle)
                        endAngle = endAngle - (arrowEnd.length < 0 ? 0 : arrowEnd.length);
                        startAngle = startAngle + (arrowStart.length < 0 ? 0 : arrowStart.length);
                        start = polarToCartesian(x, y, radius, endAngle);
                        end = polarToCartesian(x, y, radius, startAngle);
                        arrow_start_1 = polarToCartesian(x, y, radius - arrowStart.width, startAngle + arrowStart.angle);
                        arrow_start_2 = polarToCartesian(x, y, radius + (width / 2), startAngle - arrowStart.length);
                        arrow_start_3 = polarToCartesian(x, y, radius + width + arrowStart.width, startAngle + arrowStart.angle);
                        arrow_start_4 = polarToCartesian(x, y, radius + width, startAngle);
                        arrow_end_1 = polarToCartesian(x, y, radius + width + arrowEnd.width, endAngle - arrowEnd.angle);
                        arrow_end_2 = polarToCartesian(x, y, radius + (width / 2), endAngle + arrowEnd.length);
                        arrow_end_3 = polarToCartesian(x, y, radius - arrowEnd.width, endAngle - arrowEnd.angle);
                        arrow_end_4 = polarToCartesian(x, y, radius, endAngle);
                        start2 = polarToCartesian(x, y, radius + width, endAngle);
                        arcSweep = endAngle - startAngle <= 180 ? "0" : "1";
                        d = ["M", start.x, start.y, "A", radius, radius, 0, arcSweep, 0, end.x, end.y, "L", arrow_start_1.x, arrow_start_1.y, "L", arrow_start_2.x, arrow_start_2.y, "L", arrow_start_3.x, arrow_start_3.y, "L", arrow_start_4.x, arrow_start_4.y, "A", radius + width, radius + width, 0, arcSweep, 1, start2.x, start2.y, "L", arrow_end_1.x, arrow_end_1.y, "L", arrow_end_2.x, arrow_end_2.y, "L", arrow_end_3.x, arrow_end_3.y, "L", arrow_end_4.x, arrow_end_4.y, "z"].join(" ");
                    }
                }

                return d;
            }

            function pathScale(x, y, radius, interval, total, tickLength) {

                x = Number(x || 0);
                y = Number(y || 0);
                radius = Number(radius || 0);
                interval = Number(interval || 0);
                total = Number(total || 0);
                tickLength = Number(tickLength || 2);

                var alpha, sin, cos, i,
                    numTicks = Number(interval) > 0 ? Number(total) / Number(interval) : 0,
                    beta = 2 * Math.PI / numTicks,
                    precision = -1,
                    d = '';

                for (i = 0; i < numTicks; i += 1) {
                    alpha = beta * i - Math.PI / 2;
                    cos = Math.cos(alpha);
                    sin = Math.sin(alpha);
                    d += "M" + round10((x + (radius * cos)), precision) + "," + round10((y + (radius * sin)), precision) + " L" + round10((x + ((radius + tickLength) * cos)), precision) + "," + round10((y + ((radius + tickLength) * sin)), precision) + " ";
                }
                d = d || "M 0,0";
                return d;

            }

            function elementScaleLabels(x, y, radius, interval, total) {

                x = Number(x);
                y = Number(y);
                radius = Number(radius);
                interval = Number(interval);
                total = Number(total);

                var alpha, sin, cos, i,
                    numTicks = Number(interval) > 0 ? Number(total) / Number(interval) : 0,
                    beta = 2 * Math.PI / numTicks,
                    precision = -1,
                    labelArr = [];


                for (i = 0; i < numTicks; i += 1) {
                    alpha = beta * i - Math.PI / 2;
                    cos = Math.cos(alpha);
                    sin = Math.sin(alpha);
                    labelArr.push({
                        x : round10((x + (radius * cos)), precision),
                        y : round10((y + (radius * sin)), precision),
                        text : interval * i
                    });
                }
                return labelArr;

            }

            function Numeric(numberVal, numberDefault) {
                return isNaN(numberVal) ? numberDefault || 0 : Number(numberVal);
            }

            return {
                api : {
                    addPlasmid : addPlasmid,
                    plasmids : plasmids,
                    plasmid : plasmid,
                    plasmidtracks : tracks,
                    trackmarkers : markers
                },
                util : {
                    polarToCartesian : polarToCartesian,
                    swapProperties : swapProperties,
                    Numeric : Numeric
                },
                svg : {
                    createNode : createNode,
                    removeAttributes : removeAttributes,
                    path : {
                        donut : pathDonut,
                        arc : pathArc,
                        scale : pathScale
                    },
                    element : {
                        scalelabels : elementScaleLabels
                    }
                }
            };

        });
         
         


    angular.module("angularplasmid", ["angularplasmid.services"])

        .directive("plasmidapi", ['SVGUtil', function (SVGUtil) {
            return {
                restrict: "AE",
                link : function (scope, elem, attr) {
                    scope[attr.name] = SVGUtil.api;
                }
            };
        }])

        .directive("plasmid", ['SVGUtil', function (SVGUtil) {
            return {
                restrict: 'AE',
                type : 'svg',
                template : '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"></svg>',
                replace : true,
                transclude: true,
                require: 'plasmid',
                scope: {
                    plasmidheight : '@',
                    plasmidwidth : '@',
                    sequencelength : '@',
                    sequence : '@',
                    plasmidclass : '@',
                    plasmidstyle : '@'
                },
                link : {
                    pre : function (scope, elem, attr, plasmidController) {
                        plasmidController.init(elem);
                    },
                    post : function (scope, elem, attrs, plasmidController, transcludeFn) {

                        // Manually transclude children elements
                        transcludeFn(scope.$parent, function (content) {
                            elem.append(content);
                        });

                        // Watch for changes to plasmid
                        scope.$watchGroup(['plasmidheight', 'plasmidwidth', 'sequencelength', 'sequence', 'plasmidclass', 'plasmidstyle'], function () {plasmidController.draw(); });
                    }
                },
                controller : ['$scope', 'SVGUtil', function ($scope, SVGUtil) {
                    var element, plasmid, tracks = [];

                    plasmid = this;
                    
                    plasmid.elementtype = "plasmid";

                    plasmid.init = function (elem) {
                        SVGUtil.api.addPlasmid(plasmid);
                        element = elem;
                        plasmid.id = element.attr("id");
                    };

                    plasmid.draw = function () {
                        var d = plasmid.dimensions, plasmidclass = element.plasmidclass, plasmidstyle = element.plasmidstyle;
                        element.attr("height", d.height);
                        element.attr("width", d.width);
                        if (plasmidclass) {element.attr("class",plasmidclass);}
                        if (plasmidstyle) {element.attr("style", plasmidstyle);}

                        angular.forEach(tracks, function (t) {
                            t.draw();
                        });
                    };

                    plasmid.addTrack = function (track) {
                        tracks.push(track);
                    };

                    Object.defineProperty(plasmid, "center", {
                        get: function () {
                            var d = plasmid.dimensions;
                            return {
                                x : d.width / 2,
                                y : d.height / 2
                            };
                        }
                    });
                    Object.defineProperty(plasmid, "dimensions", {
                        get: function () {
                            return {
                                height : SVGUtil.util.Numeric($scope.plasmidheight, 300),
                                width : SVGUtil.util.Numeric($scope.plasmidwidth, 300)
                            };
                        }
                    });
                    Object.defineProperty(plasmid, "sequencelength", {
                        get: function () {
                            return (plasmid.sequence ? plasmid.sequence.length : SVGUtil.util.Numeric($scope.sequencelength));
                        }
                    });
                    Object.defineProperty(plasmid, "sequence", {
                        get: function () {
                            return $scope.sequence;
                        }
                    });
                    Object.defineProperty(plasmid, "plasmidclass", {
                        get: function () {
                            return $scope.plasmidclass;
                        }
                    });
                    Object.defineProperty(plasmid, "plasmidstyle", {
                        get: function () {
                            return $scope.plasmidstyle;
                        }
                    });                    
                    plasmid.tracks = tracks;
                }]
            };
        }])

        .directive("plasmidtrack", ['SVGUtil', '$compile', function (SVGUtil, $compile) {
            return {
                restrict: 'AE',
                type : 'svg',
                template: '<g><path></path></g>',
                replace : true,
                transclude: true,
                require: ['plasmidtrack', '^plasmid'],
                scope: {
                    radius: '@',
                    width: '@',
                    trackclass: '@',
                    trackstyle: '@',
                    trackclick: '&'
                },
                link : {
                    pre : function (scope, elem, attr, controllers, transcludeFn) {
                        var trackController = controllers[0], plasmidController = controllers[1], pathElem = angular.element(elem.children()[0]);
                        trackController.init(pathElem, plasmidController);
                    },
                    post : function (scope, elem, attr, controllers, transcludeFn) {

                        // Manually transclude children elements
                        transcludeFn(scope.$parent, function (content) {
                            elem.append(content);
                        });

                        // Apply special style to path to allow for correct display and apply directive's properties (class, style, id, name) to the path instead of the g
                        var g = angular.element(elem), path  = angular.element(elem.children()[0]), trackController = controllers[0];
                        SVGUtil.util.swapProperties(g, path);
                        path.attr("fill-rule", "evenodd");
                        $compile(path)(scope.$parent);

                        //Attach event handlers
                        path.on("click", function (e) {
                            scope.trackclick({
                                $event: e,
                                $track: trackController
                            });
                        });


                        // Watch for changes in the track
                        scope.$watchGroup(['radius', 'width', 'trackstyle', 'trackclass'], function () {trackController.draw(); });
                    }
                },
                    
                controller : ['$scope', function ($scope) {
                    var plasmid, element, plasmidTrack, markers = [], scales = [], labels = [];

                    plasmidTrack = this;
                    
                    plasmidTrack.elementtype = "plasmidtrack";

                    plasmidTrack.init = function (elem, plasmidCtrl) {
                        plasmid = plasmidCtrl;
                        plasmid.addTrack(plasmidTrack);
                        plasmidTrack.plasmid = plasmid;
                        element = elem;
                    };

                    plasmidTrack.draw = function () {
                        var center = plasmidTrack.center,
                            path = SVGUtil.svg.path.donut(center.x, center.y, plasmidTrack.radius, plasmidTrack.width),
                            trackclass = plasmidTrack.trackclass, 
                            trackstyle = plasmidTrack.trackstyle;
                        
                        element.attr("d", path);
                        if (trackclass) {element.attr("class",trackclass);}
                        if (trackstyle) {element.attr("style", trackstyle);}
                        
                        angular.forEach(markers, function (m) {
                            m.draw();
                        });
                        angular.forEach(scales, function (s) {
                            s.draw();
                        });
                        angular.forEach(labels, function (l) {
                            l.draw();
                        });
                    };

                    plasmidTrack.addMarker = function (marker) {
                        markers.push(marker);
                    };

                    plasmidTrack.addScale = function (scale) {
                        scales.push(scale);
                    };
                    
                    plasmidTrack.addLabel = function (label) {
                        labels.push(label);
                    };

                    plasmidTrack.markergroup = function (groupName) {
                        var items = [];
                        angular.forEach(markers, function (marker) {
                            if (marker.markergroup === groupName) {
                                items.push(marker);
                            }
                        });
                        return items;
                    };

                    plasmidTrack.getPosition = function (pos, positionOption, radiusAdjust) {
                        radiusAdjust = Number(radiusAdjust || 0);
                        pos = Number(pos);

                        var POSITION_OPTION_MID = 0, POSITION_OPTION_INNER = 1, POSITION_OPTION_OUTER = 2,
                            radius, angle, center = plasmidTrack.center,
                            seqLen = plasmid.sequencelength;

                        if (seqLen > 0) {
                            angle = (pos / seqLen) * 360;

                            switch (positionOption) {
                            case POSITION_OPTION_INNER:
                                radius = plasmidTrack.radius + radiusAdjust;
                                break;
                            case POSITION_OPTION_OUTER:
                                radius = plasmidTrack.radius + plasmidTrack.width + radiusAdjust;
                                break;
                            default:
                                radius = plasmidTrack.radius + (plasmidTrack.width / 2) + radiusAdjust;
                                break;
                            }
                            return SVGUtil.util.polarToCartesian(center.x, center.y, radius, angle);
                        }
                    };
                    Object.defineProperty(plasmidTrack, "center", {
                        get: function () {
                            return plasmid.center;
                        }
                    });
                    Object.defineProperty(plasmidTrack, "radius", {
                        get: function () {
                            return SVGUtil.util.Numeric($scope.radius, 100);
                        }
                    });
                    Object.defineProperty(plasmidTrack, "width", {
                        get: function () {
                            return SVGUtil.util.Numeric($scope.width, 25);
                        }
                    });
                    Object.defineProperty(plasmidTrack, "trackclass", {
                        get: function () {
                            return $scope.trackclass;
                        }
                    });
                    Object.defineProperty(plasmidTrack, "trackstyle", {
                        get: function () {
                            return $scope.trackstyle;
                        }
                    });

                    plasmidTrack.markers = markers;
                    plasmidTrack.scales = scales;
                    plasmidTrack.labels = labels;

                }]
            };
        }])

        .directive("trackscale", ['SVGUtil', '$compile', function (SVGUtil, $compile) {
            return {
                restrict: 'AE',
                type : 'svg',
                template: '<g><path></path><g></g></g>',
                replace : true,
                transclude: true,
                require: ['trackscale', '^plasmidtrack'],
                scope: {
                    interval: "@",
                    vadjust: "@",
                    ticksize: "@",
                    direction: "@",
                    showlabels : "@",
                    labelvadjust : "@",
                    labelclass : "@",
                    labelstyle : "@",
                    tickclass : "@",
                    tickstyle : "@",
                    scaleclick : "&"
                },
                link : {
                    pre : function (scope, elem, attr, controllers, transcludeFn) {
                        var scaleController = controllers[0], trackController = controllers[1], pathElem = angular.element(elem.children()[0]), groupElem = angular.element(elem.children()[1]);
                        scaleController.init(pathElem, groupElem, trackController);
                    },
                    post : function (scope, elem, attr, controllers, transcludeFn) {

                        var g, path, scaleController;

                        //Manually transclude children elements
                        transcludeFn(scope.$parent, function (content) {
                            elem.append(content);
                        });

                        //Apply directive's properties (class, style, id, name) to the path instead of the g
                        g = angular.element(elem);
                        path  = angular.element(elem.children()[0]);
                        SVGUtil.util.swapProperties(g, path);
                        $compile(path)(scope.$parent);

                        
                        //Attach event handlers
                        path.on("click", function (e) {
                            scope.scaleclick({
                                $event: e,
                                $scale: scaleController
                            });
                        });
                        
                        // Watch for changes to scale
                        scaleController = controllers[0];
                        scope.$watchGroup(['interval', 'vadjust', 'ticksize', 'labelvadjust', 'direction', 'showlabels', 'labelstyle', 'labelclass','tickstyle','tickclass'], function () {scaleController.draw(); });

                    }
                },
                controller : ['$scope', function ($scope) {
                    var track, trackScale, element, groupElement,
                        DEFAULT_LABELVADJUST = 15, DEFAULT_TICKSIZE = 3;

                    trackScale = this;
                    trackScale.elementtype = "trackscale";
                    
                    trackScale.init = function (elem, groupElem, trackCtrl) {
                        track = trackCtrl;
                        track.addScale(trackScale);
                        trackScale.track = track;
                        element = elem;
                        groupElement = groupElem;
                    };

                    trackScale.draw = function () {
                        var tickclass = trackScale.tickclass,
                            tickstyle = trackScale.tickstyle,
                            center = track.center,
                            path = SVGUtil.svg.path.scale(center.x, center.y, trackScale.radius, trackScale.interval, trackScale.total, trackScale.ticksize);

                        element.attr("d", path);
                        if (tickclass) {element.attr("class",tickclass);}
                        if (tickstyle) {element.attr("style", tickstyle);}

                        
                        if (trackScale.showlabels) {
                            trackScale.drawLabel();
                        } else {
                            groupElement.empty();
                        }
                    };

                    trackScale.drawLabel = function () {
                        var i, t, labels, center = track.center;

                        function clickHandler(e) {
                            $scope.scaleclick({
                                $event: e,
                                $scale: trackScale
                            });
                        }
                        
                        labels = SVGUtil.svg.element.scalelabels(center.x, center.y, trackScale.labelradius, trackScale.interval, trackScale.total);
                        groupElement.empty();
                        for (i = 0; i <= labels.length - 1; i += 1) {
                            t = angular.element(SVGUtil.svg.createNode('text'));
                            if (trackScale.labelclass) { t.attr('class', trackScale.labelclass); }
                            if (trackScale.labelstyle) { t.attr('style', trackScale.labelstyle); }
                            t.attr("x", labels[i].x);
                            t.attr("y", labels[i].y);
                            t.attr("text-anchor", "middle");
                            t.attr("alignment-baseline", "middle");
                            t.text(labels[i].text);
                            t.on("click", clickHandler);
                            groupElement.append(t);
                        }
                    };
                    Object.defineProperty(trackScale, "radius", {
                        get: function () {
                            return (trackScale.inwardflg ? track.radius : track.radius + track.width) +  ((trackScale.inwardflg ? -1 : 1) * trackScale.vadjust) + (trackScale.inwardflg ? -(trackScale.ticksize) : 0);
                        }
                    });
                    Object.defineProperty(trackScale, "interval", {
                        get: function () {
                            return SVGUtil.util.Numeric($scope.interval);
                        }
                    });
                    Object.defineProperty(trackScale, "vadjust", {
                        get: function () {
                            return SVGUtil.util.Numeric($scope.vadjust);
                        }
                    });
                    Object.defineProperty(trackScale, "ticksize", {
                        get: function () {
                            return SVGUtil.util.Numeric($scope.ticksize, DEFAULT_TICKSIZE);
                        }
                    });
                    Object.defineProperty(trackScale, "inwardflg", {
                        get: function () {
                            return $scope.direction === 'in' ? true : false;
                        }
                    });
                    Object.defineProperty(trackScale, "total", {
                        get: function () {
                            return track.plasmid.sequencelength;
                        }
                    });
                    Object.defineProperty(trackScale, "showlabels", {
                        get: function () {
                            return $scope.showlabels === "1" ? true : false;
                        }
                    });
                    Object.defineProperty(trackScale, "labelvadjust", {
                        get: function () {
                            return SVGUtil.util.Numeric($scope.labelvadjust, DEFAULT_LABELVADJUST);
                        }
                    });
                    Object.defineProperty(trackScale, "tickclass", {
                        get: function () {
                            return $scope.tickclass;
                        }
                    });
                    Object.defineProperty(trackScale, "tickstyle", {
                        get: function () {
                            return $scope.tickstyle;
                        }
                    });
                    Object.defineProperty(trackScale, "labelclass", {
                        get: function () {
                            return $scope.labelclass;
                        }
                    });
                    Object.defineProperty(trackScale, "labelstyle", {
                        get: function () {
                            return $scope.labelstyle;
                        }
                    });
                    Object.defineProperty(trackScale, "labelradius", {
                        get: function () {
                            return trackScale.radius + (trackScale.labelvadjust * (trackScale.inwardflg ? -1 : 1));
                        }
                    });
                }]
            };
        }])
    
        .directive("tracklabel", ['SVGUtil', function (SVGUtil) {
            return {
                restrict: 'AE',
                type : 'svg',
                template: '<text></text>',
                replace : true,
                transclude: true,
                require: ['tracklabel', '^plasmidtrack'],
                scope: {
                    text: "@",
                    hadjust : "@",
                    vadjust : "@",
                    labelclass: "@",
                    labelstyle : '@',
                    labelclick : "&"
                },
                link : {
                    pre : function (scope, elem, attr, controllers, transcludeFn) {
                        var labelController = controllers[0], trackController = controllers[1], textElem = angular.element(elem[0]);
                        labelController.init(textElem, trackController);
                    },
                    post : function (scope, elem, attr, controllers, transcludeFn) {

                        var labelController;

                        //Manually transclude children elements
                        transcludeFn(scope.$parent, function (content) {
                            elem.append(content);
                        });

                        // Set some default properties for the label display
                        elem.attr("text-anchor", "middle");
                        elem.attr("alignment-baseline", "middle");

                        //Attach event handlers
                        elem.on("click", function (e) {
                            scope.labelclick({
                                $event: e,
                                $label: labelController
                            });
                            
                        });

                        // Watch for changes to label
                        labelController = controllers[0];
                        scope.$watchGroup(['text', 'vadjust', 'hadjust','labelstyle','labelclass'], function () {labelController.draw(); });
                    }
                },
                controller : ['$scope', function ($scope) {
                    var track, trackLabel, element;
                    
                    trackLabel = this;
                    trackLabel.elementtype = "tracklabel";

                    trackLabel.init = function (elem, trackCtrl) {
                        track = trackCtrl;
                        track.addLabel(trackLabel);
                        trackLabel.track = track;
                        element = elem;
                    };

                    trackLabel.draw = function () {
                        var center = track.center, startX, startY,
                            labelclass = trackLabel.labelclass,
                            labelstyle = trackLabel.labelstyle;

                        element.attr("x", center.x + trackLabel.hadjust);
                        element.attr("y", center.y + trackLabel.vadjust);
                        element.text(trackLabel.text);
                        if (labelclass) {element.attr("class",labelclass);}
                        if (labelstyle) {element.attr("style", labelstyle);}
                    };

                    Object.defineProperty(trackLabel, "center", {
                        get: function () {
                            return track.center;
                        }
                    });
                    Object.defineProperty(trackLabel, "text", {
                        get: function () {
                            return $scope.text;
                        }
                    });
                    Object.defineProperty(trackLabel, "labelclass", {
                        get: function () {
                            return $scope.labelclass;
                        }
                    });
                    Object.defineProperty(trackLabel, "labelstyle", {
                        get: function () {
                            return $scope.labelstyle;
                        }
                    });                    
                    Object.defineProperty(trackLabel, "hadjust", {
                        get: function () {
                            return SVGUtil.util.Numeric($scope.hadjust, 0);
                        }
                    });
                    Object.defineProperty(trackLabel, "vadjust", {
                        get: function () {
                            return SVGUtil.util.Numeric($scope.vadjust, 0);
                        }
                    });
                    Object.defineProperty(trackLabel, "dimensions", {
                        get: function () {
                            return element[0].getBBox();
                        }
                    });
                }]
            };
        }])

        .directive("trackmarker", ['SVGUtil', '$compile', function (SVGUtil, $compile) {
            return {
                restrict: 'AE',
                type : 'svg',
                template: '<g><path></path></g>',
                replace : true,
                transclude: true,
                require: ['trackmarker', '^plasmidtrack'],
                scope: {
                    start: "@",
                    end: "@",
                    vadjust: "@",
                    wadjust: "@",
                    markergroup: "@",
                    arrowstartlength : "@",
                    arrowstartwidth : "@",
                    arrowstartangle : "@",
                    arrowendlength : "@",
                    arrowendwidth : "@",
                    arrowendangle : "@",
                    markerclass : "@",
                    markerstyle : "@",
                    markerclick: "&"
                },
                link : {
                    pre : function (scope, elem, attr, controllers, transcludeFn) {
                        var markerController = controllers[0], trackController = controllers[1], pathElem = angular.element(elem.children()[0]);
                        markerController.init(pathElem, trackController);
                    },
                    post : function (scope, elem, attr, controllers, transcludeFn) {

                        var markerController = controllers[0], g, path;

                        //Manually transclude children elements
                        transcludeFn(scope.$parent, function (content) {
                            elem.append(content);
                        });

                        //Apply directive's properties (class, style, id, name) to the path instead of the g
                        g = angular.element(elem);
                        path  = angular.element(elem.children()[0]);
                        SVGUtil.util.swapProperties(g, path);
                        $compile(path)(scope.$parent);

                        //Attach event handlers
                        path.on("click", function (e) {
                            scope.markerclick({
                                $event: e,
                                $marker: markerController
                            });
                        });

                        // Watch for changes to marker
                        scope.$watchGroup(['start', 'end', 'vadjust', 'wadjust', 'markergroup', 'markerclass','markerstyle','arrowstartlength', 'arrowstartwidth', 'arrowstartangle', 'arrowendlength', 'arrowendwidth', 'arrowendangle'], function () {markerController.draw(); });

                    }
                },
                controller : ['$scope', function ($scope) {
                    var track, marker, element, markerLabels = [];

                    marker = this;
                    marker.elementtype = "trackmarker";

                    marker.init = function (elem, trackCtrl) {
                        track = trackCtrl;
                        track.addMarker(marker);
                        element = elem;
                        marker.track = track;
                    };

                    marker.draw = function () {
                        var markerclass = marker.markerclass,
                            markerstyle = marker.markerstyle;
                        
                        element.attr("d", marker.getPath());
                        if (markerclass) {element.attr("class",markerclass);}
                        if (markerstyle) {element.attr("style", markerstyle);}
                        angular.forEach(markerLabels, function (markerLabel) {
                            markerLabel.draw();
                        });
                    };

                    marker.addMarkerLabel = function (markerLabel) {
                        markerLabels.push(markerLabel);
                    };

                    marker.getPath = function () {
                        var center = track.center, angle = marker.angle, radius = marker.radius;
                        return SVGUtil.svg.path.arc(center.x, center.y, radius.inner, angle.start, angle.end, marker.width, marker.arrowstart, marker.arrowend);
                    };

                    marker.getPosition = function (hAdjust, vAdjust, hAlign, vAlign) {
                        var HALIGN_MIDDLE = "middle", HALIGN_START = "start", HALIGN_END = "end",
                            VALIGN_MIDDLE = "middle", VALIGN_INNER = "inner", VALIGN_OUTER = "outer",
                            center, radius, angle, markerRadius, markerAngle;

                        center = track.center;
                        markerRadius = marker.radius;
                        markerAngle = marker.angle;
                        hAdjust = SVGUtil.util.Numeric(hAdjust);
                        vAdjust = SVGUtil.util.Numeric(vAdjust);

                        if (vAlign !== undefined && hAlign !== undefined) {
                            switch (vAlign) {
                            case VALIGN_INNER:
                                radius =  markerRadius.inner + vAdjust;
                                break;
                            case VALIGN_OUTER:
                                radius =  markerRadius.outer + vAdjust;
                                break;
                            default:
                                radius =  markerRadius.middle + vAdjust;
                                break;
                            }

                            switch (hAlign) {
                            case HALIGN_START:
                                angle = markerAngle.start + hAdjust;
                                break;
                            case HALIGN_END:
                                angle = markerAngle.end + hAdjust;
                                break;
                            default:
                                angle = markerAngle.middle + hAdjust;
                                break;
                            }

                            return SVGUtil.util.polarToCartesian(center.x, center.y, radius, angle);
                        } else {

                            radius = {
                                outer : markerRadius.outer + vAdjust,
                                inner : markerRadius.inner + vAdjust,
                                middle : markerRadius.middle + vAdjust
                            };

                            angle = {
                                begin : markerAngle.start + hAdjust,
                                end : markerAngle.end + hAdjust,
                                middle : markerAngle.middle + hAdjust
                            };


                            return {
                                outer : {
                                    begin: SVGUtil.util.polarToCartesian(center.x, center.y, radius.outer, angle.begin),
                                    middle: SVGUtil.util.polarToCartesian(center.x, center.y, radius.outer, angle.middle),
                                    end: SVGUtil.util.polarToCartesian(center.x, center.y, radius.outer, angle.end)
                                },
                                middle : {
                                    begin: SVGUtil.util.polarToCartesian(center.x, center.y, radius.middle, angle.begin),
                                    middle: SVGUtil.util.polarToCartesian(center.x, center.y, radius.middle, angle.middle),
                                    end: SVGUtil.util.polarToCartesian(center.x, center.y, radius.middle, angle.end)
                                },
                                inner : {
                                    begin: SVGUtil.util.polarToCartesian(center.x, center.y, radius.inner, angle.begin),
                                    middle: SVGUtil.util.polarToCartesian(center.x, center.y, radius.inner, angle.middle),
                                    end: SVGUtil.util.polarToCartesian(center.x, center.y, radius.inner, angle.end)
                                }
                            };
                        }

                    };
                    marker.fireClick = function (event) {
                        $scope.markerclick({
                            $event: event.$event,
                            $marker: event.$marker
                        });
                    };
                    Object.defineProperty(marker, "center", {
                        get: function () {
                            return track.center;
                        }
                    });
                    Object.defineProperty(marker, "radius", {
                        get: function () {
                            return {
                                inner : track.radius + marker.vadjust,
                                outer : track.radius + marker.vadjust + marker.width,
                                middle : track.radius + marker.vadjust + marker.width / 2
                            };
                        }
                    });
                    Object.defineProperty(marker, "angle", {
                        get: function () {
                            var startAngle, endAngle, midAngle, end;

                            startAngle = (marker.start / track.plasmid.sequencelength) * 360;

                            end = $scope.end || $scope.start;
                            endAngle = (SVGUtil.util.Numeric(end) / track.plasmid.sequencelength) * 360;
                            endAngle += (endAngle < startAngle) ? 360 : 0;

                            midAngle = startAngle + ((endAngle - startAngle) / 2);

                            return {
                                start : startAngle,
                                middle : midAngle,
                                end : endAngle
                            };
                        }
                    });
                    Object.defineProperty(marker, "vadjust", {
                        get: function () {
                            return SVGUtil.util.Numeric($scope.vadjust);
                        }
                    });
                    Object.defineProperty(marker, "wadjust", {
                        get: function () {
                            return SVGUtil.util.Numeric($scope.wadjust);
                        }
                    });
                    Object.defineProperty(marker, "width", {
                        get: function () {
                            return track.width + marker.wadjust;
                        }
                    });
                    Object.defineProperty(marker, "start", {
                        get: function () {
                            return SVGUtil.util.Numeric($scope.start);
                        }
                    });
                    Object.defineProperty(marker, "end", {
                        get: function () {
                            return SVGUtil.util.Numeric($scope.end);
                        }
                    });
                    Object.defineProperty(marker, "arrowstart", {
                        get: function () {
                            return {
                                width : SVGUtil.util.Numeric($scope.arrowstartwidth),
                                length : SVGUtil.util.Numeric($scope.arrowstartlength),
                                angle : SVGUtil.util.Numeric($scope.arrowstartangle)
                            };
                        }
                    });
                    Object.defineProperty(marker, "arrowend", {
                        get: function () {
                            return {
                                width : SVGUtil.util.Numeric($scope.arrowendwidth),
                                length : SVGUtil.util.Numeric($scope.arrowendlength),
                                angle : SVGUtil.util.Numeric($scope.arrowendangle)
                            };
                        }
                    });
                    Object.defineProperty(marker, "markergroup", {
                        get: function () {
                            return $scope.markergroup;
                        }
                    });
                    Object.defineProperty(marker, "markerclass", {
                        get: function () {
                            return $scope.markerclass;
                        }
                    });
                    Object.defineProperty(marker, "markerstyle", {
                        get: function () {
                            return $scope.markerstyle;
                        }
                    });                                        
                    Object.defineProperty(marker, "sequence", {
                        get: function () {
                            var plasmidSeq = marker.track.plasmid.sequence,
                                markerSeq = '';
                            
                            if (marker.start > marker.end) {
                                return plasmidSeq.substring(marker.start - 1, plasmidSeq.length - 1) + plasmidSeq.substring(0, marker.end - 1);
                            } else {
                                return plasmidSeq.substring(marker.start - 1, marker.end - 1);
                            }
                        }
                    });

                    marker.labels = markerLabels;

                }]
            };
        }])

        .directive("markerlabel", ['SVGUtil', '$compile', function (SVGUtil, $compile) {

            return {
                restrict: 'AE',
                type : 'svg',
                transclude: true,
                template: '<g><path></path><path id="" style="fill:none;stroke:none"></path><text></text></g>',
                require: ['markerlabel', '^trackmarker'],
                replace : true,
                scope: {
                    text : "@",
                    valign : "@",
                    vadjust : "@",
                    halign : "@",
                    hadjust : "@",
                    type : "@",
                    showline : "@",
                    linestyle : "@",
                    lineclass : "@",
                    labelstyle : "@",
                    labelclass : "@",
                    linevadjust : "@",
                    labelclick : "&"
                },
                link: {
                    pre : function (scope, elem, attr, controllers, transcludeFn) {
                        var markerlabelController = controllers[0],
                            trackMarkerController = controllers[1],
                            groupElem = angular.element(elem[0]),
                            lineElem = angular.element(elem.children()[0]),
                            pathElem = angular.element(elem.children()[1]),
                            textElem = angular.element(elem.children()[2]);

                        markerlabelController.init(textElem, groupElem, pathElem, lineElem, trackMarkerController);
                    },
                    post : function (scope, elem, attr, controllers, transcludeFn) {
                        transcludeFn(scope.$parent, function (content) {
                            elem.append(content);
                        });

                        var markerlabelController = controllers[0],
                            trackMarkerController = controllers[1],
                            g = angular.element(elem),
                            text = angular.element(elem.children()[2]);

                        //Apply directive's properties (class, style, id, name) to the text
                        text.attr("text-anchor", "middle");
                        text.attr("alignment-baseline", "middle");
                        SVGUtil.util.swapProperties(g, text);
                        $compile(text)(scope.$parent);
                        
                        //Attach event handlers
                        if (attr.labelclick) {
                            text.on("click", function (e) {
                                scope.labelclick({
                                    $event: e,
                                    $label: markerlabelController
                                });
                            });
                        // or bubble up events to the marker
                        } else {
                            text.on("click", function (e) {
                                trackMarkerController.fireClick({
                                    $event: e,
                                    $marker: trackMarkerController
                                });
                            });
                        }
                        
                        // Watch for changes to label
                        scope.$watchGroup(['text', 'type', 'valign', 'vadjust', 'halign', 'hadjust', 'showline', 'linevadjust', 'linestyle', 'labelclass','labelstyle'], function () {markerlabelController.draw(); });

                    }
                },
                controller : ['$scope', '$compile', function ($scope, $compile) {
                    var marker, markerLabel, textElement, pathElement, textPathElement, textPathSVG, lineElement, groupElement;

                    markerLabel = this;
                    markerLabel.elementtype = "markerlabel";

                    markerLabel.init = function (textElem, groupElem, pathElem, lineElem, markerCtrl) {
                        var id = 'TPATH' + (Math.random() + 1).toString(36).substring(3, 7);

                        marker = markerCtrl;
                        marker.addMarkerLabel(markerLabel);
                        markerLabel.marker = marker;
                        textElement = textElem;
                        pathElement = pathElem;
                        lineElement = lineElem;
                        groupElement = groupElem;
                        
                        pathElement.attr("id", id);

                    };

                    markerLabel.draw = function () {
                        var VALIGN_MIDDLE = "middle", VALIGN_INNER = "inner", VALIGN_OUTER = "outer",
                            HALIGN_MIDDLE = "middle", HALIGN_START = "start", HALIGN_END = "end",
                            fontSize = 0, fontAdjust = 0,
                            labelclass = markerLabel.labelclass, labelstyle = markerLabel.labelstyle,
                            pos, markerAngle, src, dst, dstPos, dstV;

                        if (labelclass) {textElement.attr("class",labelclass);}
                        if (labelstyle) {textElement.attr("style", labelstyle);}

                        if (markerLabel.type === 'path') {
                            textElement.attr("x",'');
                            textElement.attr("y",'');
                            
                            if (!textPathElement){
                                textPathSVG = document.createElementNS('http://www.w3.org/2000/svg','textPath');
                                textPathSVG.setAttributeNS("http://www.w3.org/1999/xlink", "href", "#" + pathElement.attr("id"));  
                                textPathElement = angular.element(textPathSVG);
                                $compile(textPathElement)($scope);
                                textElement.empty();
                                textElement.append(textPathElement);
                            }
                            
                            textPathSVG.textContent = markerLabel.text;
                            fontSize = window.getComputedStyle(textElement[0]).fontSize.replace("px", "");
                            fontAdjust = (markerLabel.valign === VALIGN_OUTER) ? 0 : (markerLabel.valign === VALIGN_INNER) ? Number(fontSize || 0) : Number(fontSize || 0) / 2;
                            pathElement.attr("d", markerLabel.getPath(markerLabel.hadjust, markerLabel.vadjust - fontAdjust, markerLabel.halign, markerLabel.valign));

                            switch (markerLabel.halign) {
                            case HALIGN_START:
                                textElement.attr("text-anchor", "start");
                                textPathElement[0].setAttribute("startOffset", "0%"); //jQuery can't handle case sensitive names so can't use textPathElem.attr
                                break;
                            case HALIGN_END:
                                textElement.attr("text-anchor", "end");
                                textPathElement[0].setAttribute("startOffset", "100%");//jQuery can't handle case sensitive names so can't use textPathElem.attr
                                break;
                            default:
                                textElement.attr("text-anchor", "middle");
                                textPathElement[0].setAttribute("startOffset", "50%");//jQuery can't handle case sensitive names so can't use textPathElem.attr
                                break;
                            }
                        } else {
                            if (textPathElement){
                                textPathElement.remove();
                                textPathElement = null;
                            }
                            pos = marker.getPosition(markerLabel.hadjust, markerLabel.vadjust, markerLabel.halign, markerLabel.valign);
                            textElement.attr("x", pos.x);
                            textElement.attr("y", pos.y);
                            textElement.text(markerLabel.text);
                        }

                        if (markerLabel.showlineflg) {

                            src = marker.getPosition(markerLabel.hadjust, markerLabel.vadjust + markerLabel.linevadjust, markerLabel.halign, markerLabel.valign);

                            dstPos = marker.getPosition();
                            dstV = markerLabel.valign === VALIGN_INNER ? dstPos.inner : markerLabel.valign === VALIGN_MIDDLE ? dstPos.middle : dstPos.outer;
                            dst = markerLabel.halign === HALIGN_START ? dstV.begin : markerLabel.halign === HALIGN_END ? dstV.end : dstV.middle;

                            lineElement.attr("d", ["M", src.x, src.y, "L", dst.x, dst.y].join(" "));
                            if (!markerLabel.linestyle && !markerLabel.lineclass) { lineElement.attr("style", "stroke:#000"); }
                            if (markerLabel.linestyle) { lineElement.attr("style", markerLabel.linestyle); }
                            if (markerLabel.lineclass) { lineElement.attr("class", markerLabel.lineclass); }
                        } else {
                            lineElement.removeAttr("d");
                        }
                    };

                    markerLabel.getPath = function (hAdjust, vAdjust, hAlign, vAlign) {
                        var VALIGN_MIDDLE = "middle", VALIGN_INNER = "inner", VALIGN_OUTER = "outer",
                            HALIGN_MIDDLE = "middle", HALIGN_START = "start", HALIGN_END = "end",
                            center = marker.center,
                            radius, markerRadius, markerAngle, startAngle, endAngle;

                        markerRadius = marker.radius;
                        switch (vAlign) {
                        case VALIGN_INNER:
                            radius = markerRadius.inner;
                            break;
                        case VALIGN_OUTER:
                            radius = markerRadius.outer;
                            break;
                        default:
                            radius = markerRadius.middle;
                            break;
                        }

                        markerAngle = marker.angle;
                        switch (hAlign) {
                        case HALIGN_START:
                            startAngle = markerAngle.start;
                            endAngle = markerAngle.start + 359.99;
                            break;
                        case HALIGN_END:
                            startAngle = markerAngle.end + 1;
                            endAngle = markerAngle.end;
                            break;
                        default:
                            startAngle = markerAngle.middle + 180.05;
                            endAngle = markerAngle.middle + 179.95;
                            break;
                        }

                        return SVGUtil.svg.path.arc(center.x, center.y, radius + Number(vAdjust || 0), startAngle + Number(hAdjust || 0), endAngle + Number(hAdjust || 0), 1);
                    };
                    Object.defineProperty(markerLabel, "showlineflg", {
                        get: function () {
                            return ($scope.showline === "1" ? true : false);
                        }
                    });
                    Object.defineProperty(markerLabel, "halign", {
                        get: function () {
                            return $scope.halign || "middle";
                        }
                    });
                    Object.defineProperty(markerLabel, "valign", {
                        get: function () {
                            return $scope.valign || "middle";
                        }
                    });
                    Object.defineProperty(markerLabel, "hadjust", {
                        get: function () {
                            return SVGUtil.util.Numeric($scope.hadjust);
                        }
                    });
                    Object.defineProperty(markerLabel, "vadjust", {
                        get: function () {
                            return SVGUtil.util.Numeric($scope.vadjust);
                        }
                    });
                    Object.defineProperty(markerLabel, "type", {
                        get: function () {
                            return $scope.type;
                        }
                    });
                    Object.defineProperty(markerLabel, "linevadjust", {
                        get: function () {
                            return SVGUtil.util.Numeric($scope.linevadjust);
                        }
                    });
                    Object.defineProperty(markerLabel, "labelclass", {
                        get: function () {
                            return $scope.labelclass;
                        }
                    });
                    Object.defineProperty(markerLabel, "labelstyle", {
                        get: function () {
                            return $scope.labelstyle;
                        }
                    });
                    Object.defineProperty(markerLabel, "linestyle", {
                        get: function () {
                            return $scope.linestyle;
                        }
                    });
                    Object.defineProperty(markerLabel, "lineclass", {
                        get: function () {
                            return $scope.lineclass;
                        }
                    });
                    Object.defineProperty(markerLabel, "text", {
                        get: function () {
                            return $scope.text;
                        }
                    });
                }]
            };
        }])
    
        .directive("svgelement", ['SVGUtil', function (SVGUtil) {
            return {
                restrict: 'AE',
                template: function(elem, attr){
                    return '<' + attr.type + '></' + attr.type + '>';
                },
                type : 'svg',
                replace : true,
                transclude: true,
                require: ['^plasmid'],
                scope: {},
                link: function (scope, elem, attr, controllers, transcludeFn) {

                    //Manually transclude children elements
                    transcludeFn(scope.$parent, function (content) {
                        elem.append(content);
                    });
                }
            };
        }])

         
         
angular.module('psk', ['ngMaterial'])
    .config(function($locationProvider) {
    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
        });
    })
    .controller('plasmidController', function($scope,$mdDialog,$mdSidenav, $mdColorPalette,$mdColors, $mdColorUtil,$mdToast, $mdPanel, $window,$location) {
        
        
    var pc = this;
    var currVAdjust = 60;
    var currMarkerId = 2;
    var originatorEv;
    
    pc.colorUtil = $mdColorUtil;
    pc.mdcolors = $mdColors;
    pc.colors = Object.keys($mdColorPalette);
    
    pc.log = ["Init log"];
    

    pc.plasmidtitle = "GO_ParisSaclay MTX";
    pc.plasmidsubtitle = "in pBR322";
    
    if($location.url() == "/headless.html")
    {
        pc.markers = [];
    }else{
    pc.markers = [
        {id : 1,
            text:'pBR322',
            type : 'Restriction pair',
            position: 350,
            remark : "Plasmid backbone",
            length : 470,
            spec_attr : {border1 : "EagI",
                border2 : "EcoRI",
                fillcolor : "#ba583b1f",
                reverse : false,
                lheight : 40,
                height : 75,
                angle : 0}
        },
        {id : 13,
            text:'Terminator T1',
            type : 'Terminator',
            position: 845,
            remark : "folC terminator",
            length : 20,
            spec_attr : {border1 : "EagI",
                border2 : "EcoRI",
                fillcolor : "#ba583b1f",
                reverse : false,
                lheight : 40,
                height : 75,
                angle : 10}
        },
        {id : 13,
            text:'folC',
            type : 'CDS',
            position: 856,
            remark : "Cloned from E. coli MG1655",
            length : 94,
            spec_attr : {border1 : "EagI",
                border2 : "EcoRI",
                fillcolor : "#9da140",
                reverse : false,
                lheight : 40,
                height : 75,
                angle : 0}
        },
        {id : 10,
            text:'folC RBS',
            type : 'RBS',
            position: 955,
            remark : "Consensus RBS",
            length : 20,
            spec_attr : {border1 : "EagI",
                border2 : "EcoRI",
                fillcolor : "#ba583b1f",
                reverse : false,
                lheight : 40,
                height : 75,
                angle : 5}
        },
        {id : 4,
            text:'araO (pBAD)',
            type : 'Promoter',
            position: 960,
            remark : "folC promoter",
            length : 25,
            spec_attr : {border1 : "XhoI",
                border2 : "Acc65I",
                fillcolor : "#ff0",
                reverse : true,
                lheight : 40,
                height : 75,
                angle : -7
            }
        },
        {id : 3,
            text:' ',
            type : 'Restriction pair',
            position: 995,
            remark : "Promoter switcher",
            length : 40,
            spec_attr : {border1 : "XhoI",
                border2 : "Acc65I",
                fillcolor : "#ba583b1f",
                reverse : false,
                lheight : 61,
                height : 125,
                angle : 0
            }
        },
        {id : 5,
            text:'lacO (pL)',
            type : 'Promoter',
            position: 5,
            remark : "cpg2 promoter",
            length : 25,
            spec_attr : {border1 : "XhoI",
                border2 : "Acc65I",
                fillcolor : "#ff0",
                reverse : false,
                lheight : 40,
                height : 75,
                angle : 0
                
            }
        },
        {id : 11,
            text:'cpg2 RBS',
            type : 'RBS',
            position: 45,
            remark : "Consensus RBS",
            length : 20,
            spec_attr : {border1 : "EagI",
                border2 : "EcoRI",
                fillcolor : "#ba583b1f",
                reverse : false,
                lheight : 40,
                height : 75,
                angle : 5}
        },
        {id : 16,
            text:'cpg2',
            type : 'CDS',
            position: 50,
            remark : "Recoded & synthetized",
            length : 100,
            spec_attr : {border1 : "EagI",
                border2 : "EcoRI",
                fillcolor : "#7f63b8",
                reverse : false,
                lheight : 40,
                height : 75,
                angle : 0}
        },
        {id : 17,
            text:'Terminator T1',
            type : 'Terminator',
            position: 162,
            remark : "folC terminator",
            length : 20,
            spec_attr : {border1 : "EagI",
                border2 : "EcoRI",
                fillcolor : "#ba583b1f",
                reverse : false,
                lheight : 40,
                height : 75,
                angle : 25}
        },
        {id : 2,
            text:' ',
            type : 'Restriction pair',
            position: 155,
            remark : "Operon maker",
            length : 43,
            spec_attr : {border1 : "AvrII",
                border2 : "NheI",
                fillcolor : "#ba583b1f",
                reverse : false,
                lheight : 40,
                height : 75,
                angle : 0
                
            }
        },
        {id : 6,
            text:'tetO',
            type : 'Promoter',
            position: 170,
            remark : "abgT promoter",
            length : 25,
            spec_attr : {border1 : "XhoI",
                border2 : "Acc65I",
                fillcolor : "#ff0",
                reverse : false,
                lheight : 40,
                height : 75,
                angle : 0
                
            }
        },
        {id : 12,
            text:'abgT RBS',
            type : 'RBS',
            position: 205,
            remark : "Consensus RBS",
            length : 20,
            spec_attr : {border1 : "EagI",
                border2 : "EcoRI",
                fillcolor : "#ba583b1f",
                reverse : false,
                lheight : 40,
                height : 75,
                angle : 5}
        },
        {id : 16,
            text:'abgT',
            type : 'CDS',
            position: 210,
            remark : "Cloned from E. Coli, restriction recoded",
            length : 80,
            spec_attr : {border1 : "EagI",
                border2 : "EcoRI",
                fillcolor : "#7f63b8",
                reverse : false,
                lheight : 40,
                height : 75,
                angle : 0}
        },
        {id : 17,
            text:'Terminator T1',
            type : 'Terminator',
            position: 292,
            remark : "folC terminator",
            length : 20,
            spec_attr : {border1 : "EagI",
                border2 : "EcoRI",
                fillcolor : "#ba583b1f",
                reverse : false,
                lheight : 40,
                height : 75,
                angle : 35}
        },
        {id : 7,
            text:'Rop',
            type : 'Misc block',
            position: 490,
            remark : "Repression-of-plasmid locus",
            length : 60,
            spec_attr : {border1 : "XhoI",
                border2 : "Acc65I",
                fillcolor : "#ff0",
                reverse : false,
                lheight : 40,
                height : 75,
                angle : 0
                
            }
        },
        {id : 8,
            text:'Ori',
            type : 'Misc block',
            position: 600,
            remark : "Replication origin",
            length : 30,
            spec_attr : {border1 : "XhoI",
                border2 : "Acc65I",
                fillcolor : "#ff0",
                reverse : false,
                lheight : 40,
                height : 75,
                angle : 0
                
            }
        },
        {id : 9,
            text:'AmpR',
            type : 'Misc block',
            position: 650,
            remark : "Ampicillin resistance cassette",
            length : 120,
            spec_attr : {border1 : "XhoI",
                border2 : "Acc65I",
                fillcolor : "#ff0",
                reverse : false,
                lheight : 40,
                height : 75,
                angle : 0
                
            }
        }
    ];
    } // else (headless)
    
    
    pc.currMarkerEdited = pc.markers[0];
    
    $scope.selectedMarker = 0;
    pc.selectedMarkerIdx = 0;
        
    pc.addLabel = function() {
        var labelTypeVar = 'titlelabel';
        if(pc.labelType == true)
            labelTypeVar = 'subtitlelabel';
        
        pc.labels.push({text:pc.labelText, vadjust:currVAdjust, type:labelTypeVar});
        pc.labelText = '';
        pc.labelType = false;
        currVAdjust += 30;
    };
    pc.removeLastLabel = function() {
        if(pc.labels.length == 1)
            return;
        pc.labels.pop();
        currVAdjust -= 30;
    };
    
    pc.addMarker = function() {
        pc.markers.push({id: currMarkerId,
            text: "New marker",
            type: "Restriction site",
            position : 500,
            length : 20,
            spec_attr : {border1 : "EcoRI",
                border2 : "BamHI",
                fillcolor : "#ba583b1f",
                reverse : false,
                lheight : 40,
                height : 75,
                angle : 0
            }});
        currMarkerId += 1;
        $mdToast.show(
        $mdToast.simple()
        .textContent('New feature added !')
        .hideDelay(2000)
        );
    };
    pc.deleteMarker = function(index) {
        pc.markers.splice(index, 1);
        
        pc.currMarkerEdited = pc.markers[0];    
        $scope.selectedMarker = 0;
        pc.selectedMarkerIdx = 0;
        $mdToast.show(
        $mdToast.simple()
        .textContent('Feature deleted !')
        .hideDelay(2000)
        );
    };    
    
    pc.openMenu = function($mdMenu, ev) {
      originatorEv = ev;
      $mdMenu.open(ev);
    };
    
    
    
    pc.globalMenuAction = function(name, ev) {
        if(name == "savelocal")
      {
          pc.saveLocal();
      }
      if(name == "loadlocal")
      {
          pc.loadLocal();
      }
     if(name == "showinternal")
      {
          pc.showInternal();
      }
      if(name == "savefile")
      {
          pc.saveFile();
      }
      if(name == "loadfile")
      {
          pc.loadFile();
      }
      if(name == "headless")
      {
          pc.showHeadless();
      }
      if(name == "new")
      {
          var confirm = $mdDialog.confirm()
          .title('Delete existing work ?')
          .textContent('Creating a new plasmid will erase all work on the current plasmid.')
          .ariaLabel('Lucky day')
          .targetEvent(ev)
          .ok('Delete plasmid & create new')
          .cancel('Keep current plasmid');

        $mdDialog.show(confirm).then(function() {
        pc.markers = [
        {id: 0,
            text:'New feature',
            type : 'Restriction site',
            position:0,
            remark : "Cutting site",
            length : 0,
            spec_attr : {border1 : "EcoRI",
                border2 : "BamHI",
                fillcolor : "#ba583b1f",
                reverse : false,
                lheight : 65,
                height : 75,
                angle : 0
            }
        }];
        }, function() {});
          
        }
        if(name == "editlabel")
      {
            var title = $mdDialog.prompt()
            .title('Edit plasmid title')
            .textContent('Enter desired plasmid title. (Bold first line)')
            .placeholder('Plasmid title')
            .ariaLabel('Plasmid title')
            .initialValue(pc.plasmidtitle)
            .targetEvent(ev)
            .required(true)
            .ok('Use this title')
            .cancel('Cancel');
            

            $mdDialog.show(title).then(function(result) {
                
                pc.plasmidtitle = result;
            
                var subtitle = $mdDialog.prompt()
                .title('Edit plasmid subtitle')
                .textContent('Enter desired plasmid subtitle. (second line)')
                .placeholder('Plasmid subtitle')
                .ariaLabel('Plasmid subtitle')
                .initialValue(pc.plasmidsubtitle)
                .targetEvent(ev)
                .required(true)
                .ok('Use this subtitle')
                .cancel('Cancel');
                
                $mdDialog.show(subtitle).then(function(subresult) {
                    pc.plasmidsubtitle = subresult;
                 }, function() {
                return;
                });
            }, function() {
                return;
            });
          
        }
        if(name == "export")
        {
           
          pc.exportSVG();
        }
    };
    
    pc.showHeadless = function () {
        localStorage.setItem("plasmidHeadlessStorage",angular.toJson([pc.plasmidtitle,pc.plasmidsubtitle,pc.markers]));
        $window.open('headless.html', '_blank');
    }
    
    pc.restoreForHeadless = function () {
        var a = angular.fromJson(localStorage.getItem("plasmidHeadlessStorage"));
        if(a == undefined)
        {
            pc.markers = [];
            pc.plasmidtitle = "Error";
            pc.plasmidsubtitle = "while showing headless";
        }else{
            pc.plasmidtitle = a[0];
            pc.plasmidsubtitle = a[1];
            pc.markers = a[2];
        }
    }
    
    if($location.url() == "/headless.html")
    {
        pc.restoreForHeadless();
    }

    pc.selectMarker = function (index) {
    if ($scope.selectedMarker === null) {
      $scope.selectedMarker = index;
      pc.currMarkerEdited = pc.markers[pc.selectedMarkerIdx];
    }
    else {
      $scope.selectedMarker = index;
      pc.selectedMarkerIdx = index;
      pc.currMarkerEdited = pc.markers[pc.selectedMarkerIdx];
    }
  }

    pc.toggleAdvSidenav = function(){
       $mdSidenav('advSideNav')
          .toggle();
    };
           
    pc.isAdvSideNavOpen = function(){
      return $mdSidenav('advSideNav').isOpen();
    };
    
    pc.closeAdvSidenav = function () {
      // Component lookup should always be available since we are not using `ng-if`
      $mdSidenav('advSideNav').close()
       
    };
    

    pc.exportSVG = function () {

        var title = $mdDialog.alert()
            .title('Export is not implemented')
            .textContent('Sorry, export as image file is not yet implemented. The recommended workaround is to use the "Show headless" menu, then print the page as PDF, which will provide you a vector image in most case.')
                    .ariaLabel('no export')
                    .clickOutsideToClose(false)
        .ok('Got it!');
            
        $mdDialog.show(title);
    }
    
    pc.showInternal = function () {
        var showjson = $mdDialog.alert()
            .title('Internal JSON representation')
            .textContent(angular.toJson([pc.plasmidtitle,pc.plasmidsubtitle,pc.markers]))
                    .ariaLabel('no export')
                    .clickOutsideToClose(false)
        .ok('Close');
            
        $mdDialog.show(showjson);
    }
    
    pc.saveLocal =  function () {
        localStorage.setItem("plasmidLocalStorage",angular.toJson([pc.plasmidtitle,pc.plasmidsubtitle,pc.markers]));
        $mdToast.show(
        $mdToast.simple()
        .textContent('Saved to local storage')
        .hideDelay(2000)
        );
        
    }
    
    pc.loadLocal =  function () {

        var a = angular.fromJson(localStorage.getItem("plasmidLocalStorage"));
        if(a == undefined)
        {
                    $mdToast.show(
        $mdToast.simple()
        .textContent('Error while loading from local storage')
        .hideDelay(2000)
        );
        }else{
            pc.plasmidtitle = a[0];
            pc.plasmidsubtitle = a[1];
            pc.markers = a[2];
        $mdToast.show(
        $mdToast.simple()
        .textContent('Loaded from local storage')
        .hideDelay(2000)
        );
        }
    }
   
    
    
    pc.saveFile =  function () {
        var jsonsave = angular.toJson([pc.plasmidtitle,pc.plasmidsubtitle,pc.markers]);
        
        var file = new Blob([jsonsave], {type: 'text/plain'});
        if (window.navigator.msSaveOrOpenBlob) // IE10+
            window.navigator.msSaveOrOpenBlob(file, filename);
        else { // Others
            var a = document.createElement("a"),
                    url = URL.createObjectURL(file);
            a.href = url;
            a.download = "plasmid.json";
            document.body.appendChild(a);
            a.click();
            setTimeout(function() {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);  
            }, 0); 
        }
        
        
    }
    
    pc.loadFile =  function () {
        
        pc.showLoadDialog();
    }
    
    
    pc.showLoadDialog = function() {
        var loadDialog = {
            controller: 'plasmidController',
            templateUrl: 'tpl_load_dialog.html',
            parent: angular.element(document.body),
            clickOutsideToClose:true
        };
        $mdDialog.show(loadDialog);
    }
    
    pc.setData  = function(title, subtitle, pmarkers) {
        $scope.plasmidtitle = title;
        $scope.plasmidsubtitle = subtitle;
        $scope.markers = pmarkers;
        pmarkers.forEach(function(element) {
                pc.log.push(element);
                console.log(element);
            });
        $scope.$apply();
    }

    
    $scope.loadLocalFileFile = function() {
        var fileinput = document.getElementById('loadFileElement');
        var files = fileinput.files;
        if(files.length == 0)
        {
            $mdDialog.show($mdDialog.alert()
            .title('No file selected !')
            .textContent('You did not select a file...')
            .ariaLabel('no file')
            .clickOutsideToClose(false).ok('Ok'));
        }
        if(files.length == 1)
        {
            var reader = new FileReader();
            reader.onloadend = function(e) {
                    var loadedSave = angular.fromJson(e.target.result);
                    if(loadedSave == undefined)
                        {
                        $mdToast.show(
                        $mdToast.simple()
                        .textContent('Error while loading from file')
                        .hideDelay(2000)
                        );
                        }else{
                        var decodedData = angular.fromJson(e.target.result);
                        pc.setData(decodedData[0],decodedData[1],decodedData[2]);
                        $scope.$apply();
                        $mdToast.show(
                        $mdToast.simple()
                        .textContent('Data decoded')
                        .hideDelay(2000));
                        }
                };

            
            reader.readAsText(files[0]);
            
        }
        
        
      $mdDialog.hide();
    };
    
    $scope.cancelDialog = function() {
      $mdDialog.cancel();
    };
    
    
})



    .config(function($mdThemingProvider) {

    // Configure a dark theme with primary foreground yellow

    $mdThemingProvider.theme('docs-dark', 'default')
      .primaryPalette('purple')
      .dark();

  })

.directive('onlyNumbers', function () {
    return  {
        restrict: 'A',
        link: function (scope, elm, attrs, ctrl) {
            elm.on('keydown', function (event) {
                if(event.shiftKey){event.preventDefault(); return false;}
                //console.log(event.which);
                if ([8, 13, 27, 37, 38, 39, 40].indexOf(event.which) > -1) {
                    // backspace, enter, escape, arrows
                    return true;
                } else if (event.which >= 48 && event.which <= 57) {
                    // numbers 0 to 9
                    return true;
                } else if (event.which >= 96 && event.which <= 105) {
                    // numpad number
                    return true;
                } 
                // else if ([110, 190].indexOf(event.which) > -1) {
                //     // dot and numpad dot
                //     return true;
                // }
                else {
                    event.preventDefault();
                    return false;
                }
            });
        }
    }
});
              
         
         
         
angular.element(document).ready(function () {
        angular.bootstrap(document, ['app','psk','ngMaterial', 'ngMessages']);
})

