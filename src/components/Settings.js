import ListErrors from './ListErrors';
import React from 'react';
import agent from '../agent';
import { connect } from 'react-redux';
import {
    SETTINGS_SAVED,
    SETTINGS_PAGE_UNLOADED,
    WEBAUTHN_SAVED,
    LOGOUT
} from '../constants/actionTypes';
import { registrationBegin_FormField, registrationFinish_PostFn } from '../webauthn_js/webauthn_golang';

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

    this.submitForm = ev => {
      ev.preventDefault();

      const user = Object.assign({}, this.state);
      if (!user.password) {
        delete user.password;
      }

      this.props.onSubmitForm(user);
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

class SettingsWebauthn extends React.Component {
    constructor() {
        super();
        this.state = {
            webauthn_options: '',
        };

        this.submitForm = async ev => {
            ev.preventDefault();

            let options;
            try {
                options = await registrationBegin_FormField('#webauthn_register_form', 'webauthn_options');
                await registrationFinish_PostFn(
                    options, 
                    (assertion) => agent.Webauthn.finishRegister(this.props.currentUser.username, assertion, "/settings"),
                );
            } catch (err) {
                alert("Error registering: " + err);
                window.location.reload(false);
                return;
            }

            this.props.onWebauthnSubmitForm();
        }
    }

    componentWillMount() {
        if (this.props.currentUser) {
            // Preload the registration details if webauthn is not yet enabled
            if (!this.props.currentUser.webauthn_enabled) {
                let webauthn_options = agent.Webauthn.beginRegister(this.props.currentUser.username);
                webauthn_options.then((opts) => {
                    const newState = Object.assign({}, this.state, { webauthn_options: JSON.stringify(opts) });
                    this.setState(newState);
                });
            }
        }
    }

    render() {
        let button_text;
        let button_type;
        if (!this.props.currentUser.webauthn_enabled) {
            button_text = "Enable Webauthn";
            button_type = "btn-primary";
        } else {
            button_text = "Disable Webauthn";
            button_type = "btn-danger";
        }

        return (
          <form id="webauthn_register_form" onSubmit={this.submitForm}>
            <input type="hidden" name="webauthn_options" value={this.state.webauthn_options} />

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
    currentUser: state.common.currentUser
});

const mapDispatchToProps = dispatch => ({
    onClickLogout: () => dispatch({ type: LOGOUT }),
    onSubmitForm: user =>
        dispatch({ type: SETTINGS_SAVED, payload: agent.Auth.save(user) }),
    onWebauthnSubmitForm: () => dispatch({ type: WEBAUTHN_SAVED }),
    onUnload: () => dispatch({ type: SETTINGS_PAGE_UNLOADED })
});

class Settings extends React.Component {
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
                onWebauthnSubmitForm={this.props.onWebauthnSubmitForm} />
            
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
