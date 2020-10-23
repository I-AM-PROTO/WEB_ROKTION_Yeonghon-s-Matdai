import React, {Component} from 'react';
import './Layout.css';
import Clock from './Clock';
import UserIcon from './UserIcon';
import DocumentSettingIcon from './DocumentSettingIcon';
import {
    Sidebar,
    Grid,
    Container,
    Progress,
    Divider,
    Icon,
    Pagination,
  } from 'semantic-ui-react';
import DocumentPageContent from './DocumentPageContent';

class DocumentPageLayout extends Component{
    constructor(props){
        super(props)
        this.state = {
            selectedPage: 0,
            documentId: -1,
            savedStatusText: '?' 
        };
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if (nextProps.document.id !== prevState.documentId) {
            return {
                selectedPage: 0,
                documentId: nextProps.document.id,
            };
        } else {
            return {};
        }
    }

    /**
     * 0: 저장완료, 1: 작성중, 2: 저장중, 3: 저장오류, 4: 가져오는중, 5: 열람중(다 가져옴)
     */
    setSavedStatus = (status) => {
        let outStatus = '가져오는중';
        switch(status) {
            case 0:
                outStatus = '저장완료';
                break;
            case 1:
                outStatus = '작성중';
                break;
            case 2:
                outStatus = '저장중';
                break;
            case 3:
                outStatus = '저장오류';
                break;
            case 4: 
                outStatus = '가져오는중';
                break;
            case 5: 
                outStatus = '열람중';
                break;
            default:
                outStatus = '?';
        }
        this.setState({
            savedStatusText: outStatus
        })
    }

    render(){
        return(
            <Sidebar.Pusher className="pushableMainScreen" style={{overflow:'visible'}}>
                <div style={{padding:'10px 0px 0px 20px',
                             width:"90%",
                             minWidth:"500px",
                             maxWidth:"1000px",
                             overflow:"visible",}}>
                    <Grid className="mainScreenGrid">
                        <Grid.Row
                            columns='equal' 
                            style={{paddingTop: '1rem', paddingBottom: '0rem'}}>
                            <Container
                                as={Grid.Column}
                                textAlign='left'>
                                <Clock/>
                            </Container>
                            <Container
                                as={Grid.Column}
                                textAlign='right'
                                style={{paddingRight:'8px'}}>
                                <Icon.Group size='big' style={{marginRight:'10px'}}>
                                    <Icon name='file outline'/>
                                    <Icon corner name='search'/> 
                                </Icon.Group>
                                <DocumentSettingIcon/>
                                {false && <Icon size='large' name='ellipsis horizontal' style={{marginRight:'10px'}}/>}
                                <UserIcon size='big' handleLogout={this.props.handleLogout}/>
                            </Container>
                        </Grid.Row>
                        <Grid.Row
                            columns='equal'
                            verticalAlign='bottom'
                            style={{paddingTop: '0rem', paddingBottom: '0rem'}}>
                            <Container
                                as={Grid.Column}
                                className="title noLeftMargin"
                                textAlign='left'>
                                <b style={{fontSize:40, lineHeight:'40px'}}>
                                {this.props.document.title}</b>
                                {this.state.savedStatusText}
                            </Container>
                            <Container
                                as={Grid.Column}
                                textAlign='right'
                                width={4}
                                style={{top:'.4rem', fontSize:15}}>
                                <b>지시 및 책임자: {this.props.document.admin}</b>
                            </Container>
                        </Grid.Row>
                        <Grid.Row style={{paddingTop: '.5rem', paddingBottom: '0rem'}}>
                            <Container as={Grid.Column}
                                        className="progressBar noLeftMargin">
                                <Progress percent={80}
                                            color='green'
                                            size='small'/>
                            </Container>
                        </Grid.Row>
                        <Grid.Row style={{paddingTop: '0rem', paddingBottom: '0rem'}}>
                            <Divider as={Grid.Column}/>
                        </Grid.Row>
                        <Grid.Row style={{paddingTop: '1.5rem', paddingBottom: '0rem'}}>
                            <Container as={Grid.Column}
                                        className="contentContainer noLeftMargin"
                                        textAlign='left'>
                                <DocumentPageContent 
                                    pageData={this.props.document.documentContent[this.state.selectedPage]} 
                                    setSavedStatus={this.setSavedStatus}>
                                </DocumentPageContent>
                            </Container>
                        </Grid.Row>
                        <Grid.Row>
                            <Container as={Grid.Column} textAlign='center'>
                                <Pagination
                                    onPageChange = {
                                        (_,data) => {
                                            this.setState({
                                                selectedPage:data.activePage-1,
                                            });
                                        }
                                    }
                                    boundaryRange={0}
                                    activePage={this.state.selectedPage+1}
                                    ellipsisItem={null}
                                    firstItem={{ content: <Icon name='angle double left' />, icon: true }}
                                    lastItem={{ content: <Icon name='angle double right' />, icon: true }}
                                    prevItem={{ content: <Icon name='angle left' />, icon: true }}
                                    nextItem={{ content: <Icon name='angle right' />, icon: true }}
                                    siblingRange={3}
                                    pointing
                                    secondary
                                    totalPages={this.props.document.documentContent.length}/>
                            </Container>
                        </Grid.Row>
                    </Grid>
                </div>
            </Sidebar.Pusher>
        );
    }
}

export default DocumentPageLayout;