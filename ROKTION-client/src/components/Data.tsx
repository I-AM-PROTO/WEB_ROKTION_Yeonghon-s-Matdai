import React from 'react';
import { User } from '../types';

interface DataState {
  outputData: string,
  id: string
}

interface DataProps {

}
 
class Data extends React.Component<DataProps, DataState> {
  
  api<T>(url: string, option: Object): Promise<T> {
    return fetch(url, option)
      .then(response => {
        if (!response.ok) {
          throw new Error(response.statusText)
        }
        return response.json() as Promise<T>
      })
  }

  constructor(props: DataProps) {
    super(props);

    this.state = {
      outputData: '',
      id: ''
    }
  };

  getData(id: string) {
    this.api<{data: User}>(`/data/${id}`, {
      method: 'GET'
    }).then(({data}) => {
      if (data !== undefined) {
        this.setState({ outputData: `${this.state.outputData}, ${data.name} `});
      } else {
        throw new Error(`no such user with id ${id}`);
      }
    })
    .catch(err => {
      console.error(err);
    });
  };

  postData() {
    let tagId = Math.floor(Math.random() * 10000000) + 1;
    fetch('/data', {
      method: 'POST',
      body: JSON.stringify({
        name: Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5),
        tagId: tagId,
        permission: false,
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(res => {
      console.log(res.status, tagId);
    })
    .catch(err => {
      console.error(err);
    }) 
  }

  render() {
    return (
      <div>
        <p>Hello {this.state.outputData}</p>
        <button onClick={this.postData}>Click to POST</button>
        <input
          value={this.state.id}
          onChange={
            (e) => this.setState({ id: e.target.value })
          }
        />
        <button onClick={() => this.getData(this.state.id)}>Click to GET</button>
      </div>
    );
  }
};
 
export default Data;
