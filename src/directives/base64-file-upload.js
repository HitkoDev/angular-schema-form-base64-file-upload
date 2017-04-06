angular.module('angularSchemaFormBase64FileUpload').directive('base64FileUpload', [
    'base64FileUploadConfig',
    '$timeout',
    function (base64FileUploadConfig, $timeout) {

        var imageExts = ["3ds", "bmp", "btif", "cgm", "cmx", "djv", "djvu", "dmg", "dwg", "dxf", "fbs", "fh", "fh4", "fh5", "fh7", "fhc", "fpx", "fst", "g3", "gif", "ico", "ief", "iso", "jng", "jpe", "jpeg", "jpg", "ktx", "mdi", "mmr", "npx", "odi", "oti", "pbm", "pct", "pcx", "pgm", "pic", "png", "pnm", "ppm", "psd", "ras", "rgb", "rlc", "sgi", "sid", "svg", "svgz", "t3", "tga", "tif", "tiff", "uvg", "uvi", "uvvg", "uvvi", "wbmp", "wdp", "webp", "xbm", "xif", "xpm", "xwd"]

        return {
            restrict: 'A',
            require: 'ngModel',
            scope: true,
            link: function (scope, element, attrs, ngModel) {
                scope.ngModel = ngModel;

                scope.file = undefined;

                ngModel.$render = function () {
                    var filename = (ngModel.$viewValue || '').trim()
                    if (filename) {
                        if (filename.search(/(http\:\/\/|https\:\/\/|\/)/ig) != 0)
                            filename = '/' + filename
                        scope.file = {
                            ext: filename.split('.').slice(-1)[0],
                            name: filename.split('/').slice(-1)[0],
                            src: filename
                        }
                        scope.hasFile = true
                    }
                }

                scope.dropAreaHover = false;
                scope.fileError = false;
                scope.dropText = base64FileUploadConfig.dropText || 'Click here or drop files to upload';

                var validateFile = function (file) {
                    var valid = true;
                    var schema = scope.$eval(attrs.base64FileUpload).schema;

                    if (file.size > parseInt(schema.maxSize, 10)) {
                        valid = false;
                        ngModel.$setValidity('base64FileUploadSize', false);
                    } else {
                        ngModel.$setValidity('base64FileUploadSize', true);
                    }

                    scope.$apply();

                    return valid;
                }

                var getFile = function (file) {
                    if (!file) {
                        return;
                    }

                    if (!validateFile(file)) {
                        return;
                    }

                    scope.file = file;
                    scope.file.ext = file.name.split('.').slice(-1)[0];
                    scope.file.src = URL.createObjectURL(file);
                    scope.hasFile = true;
                    // just a simple conversion to human readable size.
                    // For now not bothering with large sizes.
                    var fileSize = file.size / 1024;
                    var unit = 'kB';
                    if (fileSize > 1024) {
                        fileSize = fileSize / 1024;
                        unit = 'MB';
                    }

                    scope.file.humanSize = fileSize.toFixed(1) + ' ' + unit;

                    var options = scope.$eval(attrs.base64FileUpload).schema.uploadOptions || {};

                    if (options.endpoint) {
                        var formData = new FormData();
                        formData.append('file', file, file.name);
                        for (var key in options) {
                            if (key != 'endpoint')
                                formData.append(key, options[key])
                        }

                        // Set up the request.
                        var xhr = new XMLHttpRequest();

                        // Open the connection.
                        xhr.open('POST', options.endpoint, true);

                        xhr.onload = function () {
                            if (xhr.status === 200) {
                                var data = JSON.parse(xhr.responseText)
                                if (data.file)
                                    ngModel.$setViewValue(data.file);
                            } else {
                                throw new Error(xhr.status + ': ' + xhr.statusText)
                            }
                        };

                        // Send the Data.
                        xhr.send(formData);

                    } else {
                        var reader = new FileReader();

                        reader.onloadstart = function (e) {
                            $timeout(function () {
                                scope.loadingFile = true;
                            }, 0);
                        }

                        reader.onload = function (e) {
                            $timeout(function () {
                                scope.loadingFile = false;
                            }, 0);

                            var prefix = 'file:' + file.name + ';';
                            ngModel.$setViewValue(prefix + e.target.result);
                        };

                        reader.readAsDataURL(file);
                    }

                    scope.$apply();
                };

                scope.isImage = function (file) {
                    if (!file) {
                        return false;
                    }

                    return imageExts.indexOf(file.ext.toLowerCase()) > -1
                }

                scope.removeFile = function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    scope.file = undefined;
                    scope.hasFile = false;
                    ngModel.$setViewValue('');
                }

                element.find('input').bind('change', function (e) {
                    getFile(e.target.files[0]);
                });

                var dropArea = element[0];
                var inputField = element.find('.base64-file--input')[0];

                var clickArea = function (e) {
                    e.stopPropagation();
                    inputField.click();
                }

                var dragOver = function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    $timeout(function () {
                        scope.dropAreaHover = true;
                    }, 0);
                };

                var dragLeave = function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    $timeout(function () {
                        scope.dropAreaHover = false;
                    }, 0);
                };

                var drop = function (e) {
                    dragLeave(e);
                    getFile(e.dataTransfer.files[0]);
                }

                dropArea.addEventListener("click", clickArea, false);
                dropArea.addEventListener("touchstart", clickArea, false);
                dropArea.addEventListener("dragenter", dragOver, false);
                dropArea.addEventListener("dragleave", dragLeave, false);
                dropArea.addEventListener("dragover", dragOver, false);
                dropArea.addEventListener("drop", drop, false);

                scope.$on('$destroy', function () {
                    dropArea.removeEventListener("click", clickArea, false);
                    dropArea.removeEventListener("touchstart", clickArea, false);
                    dropArea.removeEventListener("dragenter", dragOver, false);
                    dropArea.removeEventListener("dragleave", dragLeave, false);
                    dropArea.removeEventListener("dragover", dragOver, false);
                    dropArea.removeEventListener("drop", drop, false);
                });

            },
        };
    }
]);