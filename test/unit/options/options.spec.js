const expect = require('chai').expect;

const {
    validate,
    validateFeatures,
    retrieveFileOptions,
    OptionsError,
    ParserError
} = require('../../../lib/options');

const baseOptions = { filename: 'empty.svelte' };

describe('Options Module', () => {
    describe('options.validate', () => {
        describe('Should throw when', () => {
            it('options object is missing', () => {
                expect(() => validate()).to.throw(OptionsError.OptionsRequired);
            });

            it('input is missing, not a string, or an empty filename', () => {
                expect(() => validate({})).to.throw(OptionsError.InputRequired);
                expect(() => validate({ filename: {} })).to.throw(OptionsError.InputRequired);
                expect(() => validate({ filename: '' })).to.throw(OptionsError.InputRequired);
                expect(() => validate({ fileContent: {} })).to.throw(OptionsError.InputRequired);
            });

            it('encoding is not a string', () => {
                const options = { ...baseOptions, encoding: true };

                expect(() => validate(options)).to.throw(OptionsError.EncodingFormat);
            });

            it('encoding is not supported', () => {
                const unsupported = 'l33t-enc';
                const options = { ...baseOptions, encoding: unsupported };

                expect(() => validate(options)).to.throw(
                    OptionsError.EncodingNotSupported(unsupported)
                );
            });

            it('ignoreVisibilities is not an array', () => {
                const unsupported = 'unsupported';
                const mixed = ['private', unsupported];
                const options = { ...baseOptions, ignoredVisibilities: mixed };

                expect(() => validate(options)).to.throw(
                    OptionsError.IgnoredVisibilitiesNotSupported([unsupported])
                );
            });

            it('ignoreVisibilities contains at least one unsupported visibility', () => {
                const unsupported = 'unsupported';
                const mixed = ['private', unsupported];
                const options = { ...baseOptions, ignoredVisibilities: mixed };

                expect(() => validate(options)).to.throw(
                    OptionsError.IgnoredVisibilitiesNotSupported([unsupported])
                );
            });

            it('includeSourceLocations is not a boolean', () => {
                const options = { ...baseOptions, includeSourceLocations: 'true' };

                expect(() => validate(options)).to.throw(
                    OptionsError.IncludeSourceLocationsFormat
                );
            });
        });

        describe('Should pass when', () => {
            it('just filename is present', () => {
                expect(() => validate(baseOptions)).to.not.throw();
            });

            it('just fileContent is present', () => {
                expect(() => validate({ fileContent: 'content' })).to.not.throw();
            });

            it('fileContent is empty', () => {
                expect(() => validate({ fileContent: '' })).to.not.throw();
            });

            it('ignoreVisibilities is an empty array', () => {
                const options = { ...baseOptions, ignoredVisibilities: [] };

                expect(() => validate(options)).to.not.throw();
            });

            it('ignoreVisibilities is an array of supported visibilities', () => {
                const options = {
                    ...baseOptions,
                    ignoredVisibilities: ['protected', 'public']
                };

                expect(() => validate(options)).to.not.throw();
            });

            it('includeSourceLocations is a boolean', () => {
                const options1 = { ...baseOptions, includeSourceLocations: false };
                const options2 = { ...baseOptions, includeSourceLocations: true };

                expect(() => validate(options1)).to.not.throw();
                expect(() => validate(options2)).to.not.throw();
            });
        });
    });

    describe('options.validateFeatures', () => {
        describe('Should pass when', () => {
            it('only supported features are present', () => {
                const supported = ['something', 'else'];

                const single = ['something'];
                const options1 = { features: single };

                expect(() => validateFeatures(options1, supported)).to.not.throw();

                const all = ['else', 'something'];
                const options2 = { features: all };

                expect(() => validateFeatures(options2, supported)).to.not.throw();
            });
        });

        describe('Should throw when', () => {
            it('features is not an array', () => {
                expect(() => validateFeatures({ features: {} }, []))
                    .to.throw(ParserError.FeaturesFormat);

                expect(() => validateFeatures({ features: true }, []))
                    .to.throw(ParserError.FeaturesFormat);

                expect(() => validateFeatures({ features: 'something' }, []))
                    .to.throw(ParserError.FeaturesFormat);
            });

            it('features is an empty array', () => {
                const supported = ['something', 'else'];

                expect(() => validateFeatures({ features: [] }, supported))
                    .to.throw(ParserError.FeaturesEmpty(supported));
            });

            it('one or more features are not supported', () => {
                const supported = ['something', 'else'];

                const notSupported1 = ['other'];
                const options1 = { features: notSupported1 };

                expect(() => validateFeatures(options1, supported)).to.throw(
                    ParserError.FeaturesNotSupported(notSupported1, supported)
                );

                const notSupported2 = ['other', 'bad', 'trash'];
                const options2 = { features: notSupported2 };

                expect(() => validateFeatures(options2, supported)).to.throw(
                    ParserError.FeaturesNotSupported(notSupported2, supported)
                );
            });

            it('some features are not supported', () => {
                const supported = ['something', 'else', 'stuff'];
                const notSupported = ['other', 'thing'];

                const mixed = ['stuff', ...notSupported, 'something'];
                const options2 = { features: mixed };

                expect(() => validateFeatures(options2, supported)).to.throw(
                    ParserError.FeaturesNotSupported(notSupported, supported)
                );
            });
        });
    });

    describe('options.retrieveFileOptions', () => {
        it('Should return all file-related keys from options', () => {
            expect(retrieveFileOptions(baseOptions)).to.have.keys(
                'filename', 'fileContent', 'structure', 'encoding'
            );
        });
    });
});
