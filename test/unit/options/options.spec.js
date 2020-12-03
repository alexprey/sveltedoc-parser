const expect = require('chai').expect;

const {
    validate,
    retrieveFileOptions,
    ErrorMessage
} = require('../../../lib/options');

const baseOptions = { filename: 'empty.svelte' };

describe('Options Module', () => {
    describe('options.validate', () => {
        describe('Should throw when', () => {
            it('options object is missing', () => {
                expect(() => validate()).to.throw(ErrorMessage.OptionsRequired);
            });

            it('input is missing, not a string, or an empty filename', () => {
                expect(() => validate({})).to.throw(ErrorMessage.InputRequired);
                expect(() => validate({ filename: {} })).to.throw(ErrorMessage.InputRequired);
                expect(() => validate({ filename: '' })).to.throw(ErrorMessage.InputRequired);
                expect(() => validate({ fileContent: {} })).to.throw(ErrorMessage.InputRequired);
            });

            it('encoding is not a string', () => {
                const options = { ...baseOptions, encoding: true };

                expect(() => validate(options)).to.throw(ErrorMessage.EncodingFormat);
            });

            it('encoding is not supported', () => {
                const unsupported = 'l33t-enc';
                const options = { ...baseOptions, encoding: unsupported };

                expect(() => validate(options)).to.throw(
                    ErrorMessage.EncodingNotSupported(unsupported)
                );
            });

            it('ignoreVisibilities is not an array', () => {
                const unsupported = 'unsupported';
                const mixed = ['private', unsupported];
                const options = { ...baseOptions, ignoredVisibilities: mixed };

                expect(() => validate(options)).to.throw(
                    ErrorMessage.IgnoredVisibilitiesNotSupported([unsupported])
                );
            });

            it('ignoreVisibilities contains at least one unsupported visibility', () => {
                const unsupported = 'unsupported';
                const mixed = ['private', unsupported];
                const options = { ...baseOptions, ignoredVisibilities: mixed };

                expect(() => validate(options)).to.throw(
                    ErrorMessage.IgnoredVisibilitiesNotSupported([unsupported])
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
