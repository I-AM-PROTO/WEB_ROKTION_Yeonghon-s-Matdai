import React, { Component } from 'react';
import { Form, TextArea } from 'semantic-ui-react'

class DocumentPageContent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            uploadTimer: -1,
        }
    }

    onContentChanged = (e, data) => {
        // e: 이벤트, 주로 e.target을 쓴다. e.target 하면 html 그대로나오는데 -> name, value
        // data: 호출한 객체 데이터
        //console.log(e.target, data);
        const uploadWaitTime = 5000;

        // 여기서 내용이 수정될때마다 서버에 업로드한다.

        if (this.state.uploadTimer > 0) clearTimeout(this.state.uploadTimer);
        // 수정이 정지되고 5초 뒤에 저장되게 한다.
        this.setState({
            uploadTimer: setTimeout(() => {this.updateContent(data.value)}, uploadWaitTime),
        })
        // 마지막 수정후 5초 카운트를 세는데, 만일 그사이 수정시 타이머 리셋
        // 그리고 내용을 다시 GET 하는 타이밍은 언제로 해야될까
    }

    updateContent = (content) => {
        console.log('Update Content');
        fetch(`/api/docs/${this.props.myOpt.dbId}/${this.props.myOpt.page}`, {
            method: 'PUT',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                content: content
            })
        })
        .then(() => {
            this.props.myOpt.updateLocalPageContents(this.props.myOpt.idx, this.props.myOpt.page, content);
            /*
            return fetch(`/api/docs/${this.props.contentInfo.dbId}/${this.props.contentInfo.page}`, {
                method: 'GET',
            })*/
        })
        .catch(e => {
            console.error(e);
        })
    }

    render() {
        return (
            <Form>
                <TextArea
                    rows='30'
                    defaultValue={this.props.myOpt?.content}
                    onChange={this.onContentChanged}
                />
            </Form>
        );
    }
}

export default DocumentPageContent;