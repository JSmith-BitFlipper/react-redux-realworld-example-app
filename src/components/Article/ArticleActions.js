import { Link } from 'react-router-dom';
import React from 'react';
import agent from '../../agent';
import { connect } from 'react-redux';
import { DELETE_ARTICLE } from '../../constants/actionTypes';
import { attestationFinish_PostFn } from '../../webauthn_js/webauthn_golang';

const mapDispatchToProps = dispatch => ({
  onClickDelete: payload =>
    dispatch({ type: DELETE_ARTICLE, payload })
});

const ArticleActions = props => {
  const article = props.article;
  const del = async () => {
      try {
          var webauthn_options = await agent.Webauthn.beginAttestation("Confirm article delete");

          // Perform the attestation event
          await attestationFinish_PostFn(
              webauthn_options, 
              (assertion) => props.onClickDelete(agent.Articles.del(article.slug, assertion)),
          );
      } catch (err) {
          alert("Webauthn error: " + err);
          window.location.reload(false);
          return;
      }
  };
  if (props.canModify) {
    return (
      <span>

        <Link
          to={`/editor/${article.slug}`}
          className="btn btn-outline-secondary btn-sm">
          <i className="ion-edit"></i> Edit Article
        </Link>

        <button className="btn btn-outline-danger btn-sm" onClick={del}>
          <i className="ion-trash-a"></i> Delete Article
        </button>

      </span>
    );
  }

  return (
    <span>
    </span>
  );
};

export default connect(() => ({}), mapDispatchToProps)(ArticleActions);
