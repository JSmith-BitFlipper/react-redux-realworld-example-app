import ListErrors from './ListErrors';
import React from 'react';
import agent from '../agent';
import { connect } from 'react-redux';
import {
    SETTINGS_SAVED,
    SETTINGS_PAGE_REFRESH,
    SETTINGS_PAGE_UNLOADED,
    WEBAUTHN_REGISTER,
    WEBAUTHN_ATTESTATION,
    LOGOUT
} from '../constants/actionTypes';
import { registrationFinish_PostFn, attestationFinish_PostFn } from '../webauthn_js/webauthn_golang';

class SettingsForm extends React.Component {
  constructor() {
    super();

    this.state = {
      image: '',
      username: '',
      bio: '',
      email: '',
      password: '',
    };

    this.updateState = field => ev => {
      const state = this.state;
      const newState = Object.assign({}, state, { [field]: ev.target.value });
      this.setState(newState);
    };

      this.submitForm = async ev => {
          ev.preventDefault();

          const user = Object.assign({}, this.state);
          if (!user.password) {
              delete user.password;
          }

          var webauthn_options = null;

          // A critical field was changed and needs authentication
          if (user.username !== this.props.currentUser.username ||
              user.email !== this.props.currentUser.email ||
              user.password != null) {
              webauthn_options = await agent.Webauthn.beginAttestation(
                  "Confirm new user details:\n\tusername {0}\n\temail {1}".format(user.username, user.email));
          }

          // Perform the attestation event. If `webauthn_options === null`, then simply calls `onSubmitForm` directly
          await attestationFinish_PostFn(
              webauthn_options, 
              (assertion) => this.props.onSubmitForm(agent.Auth.save(user, assertion)),
          );
      };
  }

  componentWillMount() {
    if (this.props.currentUser) {
      Object.assign(this.state, {
        image: this.props.currentUser.image || '',
        username: this.props.currentUser.username,
        bio: this.props.currentUser.bio || '',
        email: this.props.currentUser.email
      });
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.currentUser) {
      this.setState(Object.assign({}, this.state, {
        image: nextProps.currentUser.image || '',
        username: nextProps.currentUser.username,
        bio: nextProps.currentUser.bio || '',
        email: nextProps.currentUser.email
      }));
    }
  }

  render() {
    return (
      <form onSubmit={this.submitForm}>
        <fieldset>

          <fieldset className="form-group">
            <input
              className="form-control"
              type="text"
              placeholder="URL of profile picture"
              value={this.state.image}
              onChange={this.updateState('image')} />
          </fieldset>

          <fieldset className="form-group">
            <input
              className="form-control form-control-lg"
              type="text"
              placeholder="Username"
              value={this.state.username}
              onChange={this.updateState('username')} />
          </fieldset>

          <fieldset className="form-group">
            <textarea
              className="form-control form-control-lg"
              rows="8"
              placeholder="Short bio about you"
              value={this.state.bio}
              onChange={this.updateState('bio')}>
            </textarea>
          </fieldset>

          <fieldset className="form-group">
            <input
              className="form-control form-control-lg"
              type="email"
              placeholder="Email"
              value={this.state.email}
              onChange={this.updateState('email')} />
          </fieldset>

          <fieldset className="form-group">
            <input
              className="form-control form-control-lg"
              type="password"
              placeholder="New Password"
              value={this.state.password}
              onChange={this.updateState('password')} />
          </fieldset>

          <button
            className="btn btn-lg btn-primary pull-xs-right"
            type="submit"
            disabled={this.state.inProgress}>
            Update Settings
          </button>

        </fieldset>
      </form>
    );
  }
}

// TODO: Move this into own file
class SettingsWebauthn extends React.Component {
    constructor() {
        super();
        this.state = {};

        this.submitForm = async ev => {
            ev.preventDefault();
            const username = this.props.currentUser.username;

            try {
                // Perform a registration event
                if (!this.props.currentUserHasWebauthn) {
                    let webauthn_options = await agent.Webauthn.beginRegister(username);
                    await registrationFinish_PostFn(
                        webauthn_options, 
                        (assertion) => this.props.onWebauthnRegister(this.props.currentUser.username, assertion),
                    );
                } else {
                    let webauthn_options = await agent.Webauthn.beginAttestation("Confirm disable webauthn for {0}".format(username));

                    // Perform an attestation event
                    await attestationFinish_PostFn(
                        webauthn_options, 
                        (assertion) => this.props.onWebauthnDisable(assertion),
                    );                    
                }
            } catch (err) {
                alert("Webauthn error: " + err);
                window.location.reload(false);
                return;
            }
            // TODO: Need to cause page to refresh. Should use onRefresh prop somehow
        }
    }

    render() {
        // Nothing to render if there is no `currentUser`
        if (this.props.currentUser === null) {
            return null;
        }

        let button_text;
        let button_type;
        if (!this.props.currentUserHasWebauthn) {
            button_text = "Enable Webauthn";
            button_type = "btn-primary";
        } else {
            button_text = "Disable Webauthn";
            button_type = "btn-danger";
        }

        return (
          <form id="webauthn_form" onSubmit={this.submitForm}>
            <fieldset>

              <button
                className={"btn btn-lg " + button_type + " pull-xs-right"}
                type="submit"
                disabled={this.state.inProgress}>
                {button_text}
              </button>
    
            </fieldset>
          </form>
        )
    }
}

const mapStateToProps = state => ({
    ...state.settings,
    currentUser: state.common.currentUser,
});

const mapDispatchToProps = dispatch => ({
    onRefresh: (username) => 
        dispatch({ type: SETTINGS_PAGE_REFRESH, payload: agent.Webauthn.isEnabled(username) }),
    onClickLogout: () => dispatch({ type: LOGOUT }),
    onSubmitForm: payload =>
        dispatch({ type: SETTINGS_SAVED, payload: payload }),
    onWebauthnRegister: (username, assertion) =>
        dispatch({ type: WEBAUTHN_REGISTER, payload: agent.Webauthn.finishRegister(username, assertion) }),
    onWebauthnDisable: (assertion) =>
        dispatch({ type: WEBAUTHN_ATTESTATION, payload: agent.Webauthn.disableWebauthn(assertion) }),
    onUnload: () => dispatch({ type: SETTINGS_PAGE_UNLOADED }),
});

class Settings extends React.Component {
  componentWillMount() {
      if (this.props.currentUser) {
          this.props.onRefresh(this.props.currentUser.username);
      }
  }

  componentWillUnmount() {
    this.props.onUnload();
  }

  render() {
    return (
      <div className="settings-page">
        <div className="container page">
          <div className="row">
            <div className="col-md-6 offset-md-3 col-xs-12">

              <h1 className="text-xs-center">Your Settings</h1>

              <ListErrors errors={this.props.errors}></ListErrors>

              <SettingsForm
                currentUser={this.props.currentUser}
                onSubmitForm={this.props.onSubmitForm} />

              <hr />

              <SettingsWebauthn
                currentUser={this.props.currentUser}
                currentUserHasWebauthn={this.props.currentUserHasWebauthn}
                onWebauthnRegister={this.props.onWebauthnRegister}
                onWebauthnDisable={this.props.onWebauthnDisable}
                onRefresh={this.props.onRefresh} />
            
              <hr />

              <button
                className="btn btn-outline-danger"
                onClick={this.props.onClickLogout}>
                Or click here to logout.
              </button>

            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Settings);
