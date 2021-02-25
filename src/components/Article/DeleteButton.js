import React from 'react';
import agent from '../../agent';
import { connect } from 'react-redux';
import { DELETE_COMMENT } from '../../constants/actionTypes';
import { attestationFinish_PostFn } from '../../webauthn_js/webauthn_golang';

const mapDispatchToProps = dispatch => ({
  onClick: (payload, commentId) =>
    dispatch({ type: DELETE_COMMENT, payload, commentId })
});

class DeleteButton extends React.Component {
    constructor() {
        super();

        this.del = async () => {
            let payload;
            try {
                var webauthn_options = await agent.Webauthn.beginAttestation("Confirm comment delete");

                // Perform the attestation event
                await attestationFinish_PostFn(
                    webauthn_options, 
                    (assertion) => {
                        payload = agent.Comments.delete(this.props.slug, this.props.commentId, assertion);
                    },
                );
            } catch (err) {
                alert("Webauthn error: " + err);
                window.location.reload(false);
                return;
            }

            this.props.onClick(payload, this.props.commentId);
        };
    }

    render() {
        if (this.props.show) {
            return (
              <span className="mod-options">
              <i className="ion-trash-a" onClick={this.del}></i>
              </span>
            );
        }
        return null;
    }
}

export default connect(() => ({}), mapDispatchToProps)(DeleteButton);
