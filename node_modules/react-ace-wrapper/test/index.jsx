/* global describe, it */
// import helpers
import should from 'turris-test-helpers';

// import app
import AceEditor from '../index.js';

describe('AceEditor suite', function() {
    it('Should render', function() {
        const React = this.React;
        // const TestUtils = this.TestUtils;

        // render
        const comp = React.render(
            <AceEditor mode="java" theme="github" name="test1" height="6em" />,
            this.container
        );
        // verify it exists
        should.exist(comp);
    });

    // TODO: add more tests
});
