import React, { Component } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { Modal, Button, Radio, OverlayTrigger, Tooltip, Panel, Well } from 'react-bootstrap'
import Select from 'react-select'
import axios from 'axios'
import classnames from 'classnames'

import CreateModal from '../modal'
import {
  fetchContentMessagesRecent,
  fetchContentMessagesCount,
  fetchContentCategories,
  upsertContentMessages
} from '~/actions'

const style = require('./style.scss')

class SelectContent extends Component {
  constructor(props) {
    super(props)

    this.state = { show: false, category: null, searchTerm: '', contentToEdit: null }

    window.botpress = window.botpress || {}
    window.botpress.pickContent = (options = {}, callback) => {
      this.props.fetchContentMessagesRecent({})
      this.props.fetchContentMessagesCount()
      this.props.fetchContentCategories()
      this.setState({ show: true, callback })
    }
  }

  componentWillUnmount() {
    delete window.botpress.pickContent
  }

  search = event => {
    this.setState({ searchTerm: event.target.value })
    this.props.fetchContentMessagesRecent({ searchTerm: event.target.value })
  }

  handleCreate = () => {
    this.props
      .upsertContentMessages({ categoryId: this.state.category.id, formData: this.state.contentToEdit })
      .then(() =>
        Promise.all([
          this.props.fetchContentMessagesRecent({ searchTerm: this.state.searchTerm }),
          this.props.fetchContentMessagesCount()
        ])
      )
      .then(() => this.setState({ category: null, contentToEdit: null }))
  }

  handlePick(item) {
    this.setState({ show: false })
    this.state.callback(item)
  }

  handleFormEdited = data => {
    this.setState({ contentToEdit: data })
  }

  render() {
    const props = this.props
    const noop = () => {}

    const onClose = () => this.setState({ show: false })
    const onSubmit = () => this.setState({ show: false })

    const schema = (this.state.category || {}).schema || { json: {}, ui: {} }

    return (
      <Modal animation={false} show={this.state.show} onHide={onClose} container={document.getElementById('app')}>
        <Modal.Header closeButton>
          <Modal.Title>Pick Content</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <input
            type="text"
            className="form-control"
            placeholder={`Search all content elements (${this.props.messagesCount})`}
            aria-label="Search content elements"
            onKeyUp={this.search}
          />
          <hr />
          <div className="list-group">
            {this.props.categories.map(category => (
              <a
                href="#"
                onClick={() => this.setState({ category, contentToEdit: {} })}
                className={`list-group-item list-group-item-action ${classnames(style.createItem)}`}
              >
                Create new {category.title}
              </a>
            ))}
            {this.props.messages.map(message => (
              <a href="#" className="list-group-item list-group-item-action" onClick={() => this.handlePick(message)}>
                {`[${message.categoryId}] ${message.data && message.data.question}`}
              </a>
            ))}
          </div>
        </Modal.Body>

        <CreateModal
          show={Boolean(this.state.category)}
          schema={schema.json}
          uiSchema={schema.ui}
          handleClose={() => this.setState({ category: null })}
          formData={this.state.contentToEdit}
          handleEdit={this.handleFormEdited}
          handleCreateOrUpdate={this.handleCreate}
        />
      </Modal>
    )
  }
}

const mapStateToProps = state => ({
  messages: state.content.recentMessages,
  messagesCount: state.content.messagesCount,
  categories: state.content.categories
})
const mapDispatchToProps = dispatch =>
  bindActionCreators(
    { fetchContentMessagesRecent, fetchContentMessagesCount, fetchContentCategories, upsertContentMessages },
    dispatch
  )

export default connect(mapStateToProps, mapDispatchToProps)(SelectContent)
