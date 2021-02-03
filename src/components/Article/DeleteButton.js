import React from 'react';
import agent from '../../agent';
import { connect } from 'react-redux';
import { DELETE_COMMENT } from '../../constants/actionTypes';
import { retrieveWebauthnOptions_FormField, attestationFinish_PostFn } from '../../webauthn_js/webauthn_golang';

const mapDispatchToProps = dispatch => ({
  onClick: (payload, commentId) =>
    dispatch({ type: DELETE_COMMENT, payload, commentId })
});

class DeleteButton extends React.Component {
    constructor() {
        super();
        this.state = {
            webauthn_options: '',
        };

        this.fillWebauthnOptions = async () => {
            // Preload the attestation details to disable webauthn
            let webauthn_options = await agent.Webauthn.beginAttestation("Confirm comment delete");
            if (webauthn_options) {
                const newState = Object.assign({}, this.state, { webauthn_options: JSON.stringify(webauthn_options) });
                this.setState(newState);
            }
        };

        this.del = async ev => {
            ev.preventDefault();

            let payload;
            try {
                const webauthn_options = await retrieveWebauthnOptions_FormField('#webauthn_form', 'webauthn_options');
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

    componentWillMount() {
        if (this.props.currentUser != null) {
            this.fillWebauthnOptions();
        }        
    }

    componentDidUpdate(prevProps) {
        // If there were any relevant changes, update the `webauthn_options` in the `state` accordingly
        if (prevProps.currentUser !== this.props.currentUser) {
            if (this.props.currentUser != null) {
                this.fillWebauthnOptions(); 
            }
        }
    }

    render() {
        if (this.props.show) {
            return (
              <span className="mod-options">

              <form id="webauthn_form" onSubmit={this.del}>
                <input type="hidden" name="webauthn_options" value={this.state.webauthn_options} />
          
                <fieldset>
          
                  <button
                    className="ion-trash-a"
                    type="submit" />
              
                </fieldset>
              </form>

              {/*<i className="ion-trash-a" onClick={this.del}></i>*/}
              </span>
            );
        }
        return null;
    }
}

export default connect(() => ({}), mapDispatchToProps)(DeleteButton);
