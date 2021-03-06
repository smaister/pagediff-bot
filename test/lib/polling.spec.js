describe('polling', () => {

    let mockUrl, mockRegexStr, mockInterval, mockMatchResult,
        pageAnalyser = require('../../lib/page-analyser'),
        polling = require('../../lib/polling');

    beforeEach(() => {
        mockUrl = 'http://test/url';
        mockRegexStr = '^(.*)$';
        mockInterval = 1;
        mockMatchResult = true;
        spyOn(pageAnalyser, 'match').and.callFake(() =>
            Promise.resolve(mockMatchResult)
        );
        spyOn(console, 'log');
    });

    afterEach((done) => {
        polling.stop(mockUrl);
        setTimeout(done, 1050);
    });

    describe('start', () => {

        it('should call match with the correct parameters', (done) => {
            polling.start(mockUrl, mockRegexStr, mockInterval)
                .then(() => expect(pageAnalyser.match).toHaveBeenCalledWith(mockUrl, mockRegexStr))
                .then(done);
        });

        describe('when the match result is initially false', () => {

            beforeEach(() =>
                mockMatchResult = false
            );

            it('should call the pageAnalyser every second', (done) => {
                setTimeout(() =>   //initial call
                    expect(pageAnalyser.match.calls.count()).toEqual(1)
                , 50);
                setTimeout(() =>   //one more call a second later
                    expect(pageAnalyser.match.calls.count()).toEqual(2)
                , 1050);
                setTimeout(() =>   //one more call a second later
                    expect(pageAnalyser.match.calls.count()).toEqual(3)
                , 2050);
                setTimeout(done, 2100);

                polling.start(mockUrl, mockRegexStr, mockInterval);
            });

            describe('and the match result is subsequently true', () => {

                beforeEach(() =>
                    setTimeout(() =>
                        mockMatchResult = true
                    , 500)
                );

                it('should resolve with true', (done) => {
                    polling.start(mockUrl, mockRegexStr, mockInterval)
                        .then((result) => {
                            expect(result).toEqual(mockMatchResult);
                            expect(pageAnalyser.match.calls.count()).toEqual(2);
                        })
                        .then(done);
                });

                it('should stop polling', (done) => {
                    setTimeout(() =>   //second call to match
                        expect(pageAnalyser.match.calls.count()).toEqual(2)
                    , 1050);
                    setTimeout(() =>   //not called again
                        expect(pageAnalyser.match.calls.count()).toEqual(2)
                    , 2050);
                    setTimeout(done, 2100);

                    polling.start(mockUrl, mockRegexStr, mockInterval);
                });
            });

            describe('and the matching results in an error', () => {
                let mockError;

                beforeEach(() =>
                    pageAnalyser.match.and.callFake(() =>
                        new Promise(() => {
                            mockError = new Error('b0rk');
                            throw mockError;
                        })
                    )
                );

                it('should catch the error', (done) => {
                    polling.start(mockUrl, mockRegexStr, mockInterval)
                        .then(done)
                        .catch(done.fail);
                });


                it('should log the error', (done) => {
                    polling.start(mockUrl, mockRegexStr, mockInterval)
                        .then(() => {
                            expect(console.log).toHaveBeenCalledWith('Starting polling...');
                            expect(console.log).toHaveBeenCalledWith(mockError);
                            expect(console.log).toHaveBeenCalledWith('Stopping polling...');
                        })
                        .then(done);
                });

                it('should stop polling', (done) => {
                    setTimeout(() =>   //not called after first time
                            expect(pageAnalyser.match.calls.count()).toEqual(1)
                        , 1050);
                    setTimeout(() =>   //not called after first time
                            expect(pageAnalyser.match.calls.count()).toEqual(1)
                        , 2050);
                    setTimeout(done, 2100);

                    polling.start(mockUrl, mockRegexStr, mockInterval);
                });
            });
        });
    });

    describe('stop', () => {

        beforeEach(() => {
            mockMatchResult = false;
            polling.start(mockUrl, mockRegexStr, mockInterval);
        });

        it('should immediately stop polling', (done) => {
            setTimeout(() =>   //only called once
                expect(pageAnalyser.match.calls.count()).toEqual(1)
            , 50);
            setTimeout(() =>   //not called again
                expect(pageAnalyser.match.calls.count()).toEqual(1)
            , 1050);
            setTimeout(done, 1100);

            polling.stop(mockUrl);
        });

        it('should only stop polling for the specified url', (done) => {
            setTimeout(() =>   //first call
                expect(pageAnalyser.match.calls.count()).toEqual(1)
            , 50);
            setTimeout(() =>   //still polling
                expect(pageAnalyser.match.calls.count()).toEqual(2)
            , 1050);
            setTimeout(done, 1100);

            polling.stop('http://some/other/url');
        });
    });
});
