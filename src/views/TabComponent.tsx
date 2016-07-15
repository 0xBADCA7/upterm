/* tslint:disable:no-unused-variable */
import * as React from "react";
import * as _ from "lodash";
import {Session} from "../shell/Session";
import {ApplicationComponent} from "./1_ApplicationComponent";
import * as css from "./css/main";
import {fontAwesome} from "./css/FontAwesome";
import {SplitDirection} from "../Enums";
import {Pane, RowList, PaneList} from "../utils/PaneTree";

export interface TabProps {
    isActive: boolean;
    activate: () => void;
    position: number;
    closeHandler: (event: KeyboardEvent) => void;
}

export enum TabHoverState {
    Nothing,
    Tab,
    Close
}

interface TabState {
    hover: TabHoverState;
}

export class TabComponent extends React.Component<TabProps, TabState> {
    constructor() {
        super();
        this.state = {hover: TabHoverState.Nothing};
    }

    render() {
        return <li style={css.tab(this.state.hover !== TabHoverState.Nothing, this.props.isActive)}
                   onClick={this.props.activate}
                   onMouseEnter={() => this.setState({hover: TabHoverState.Tab})}
                   onMouseLeave={() => this.setState({hover: TabHoverState.Nothing})}>
            <span style={css.tabClose(this.state.hover)}
                  dangerouslySetInnerHTML={{__html: fontAwesome.times}}
                  onClick={this.props.closeHandler}
                  onMouseEnter={() => this.setState({hover: TabHoverState.Close})}
                  onMouseLeave={() => this.setState({hover: TabHoverState.Tab})}/>
            <span style={css.commandSign}>⌘</span>
            <span>{this.props.position}</span>
        </li>;
    }
}

export class Tab {
    readonly panes: PaneList;
    private _activePane: Pane;

    constructor(private application: ApplicationComponent) {
        const pane = new Pane(new Session(this.application, this.contentDimensions));

        this.panes = new RowList([pane]);
        this._activePane = pane;
    }

    addPane(direction: SplitDirection): void {
        const session = new Session(this.application, this.contentDimensions);
        const pane = new Pane(session);

        this.panes.add(pane, this.activePane, direction);

        this._activePane = pane;
    }

    // TODO: should take a Pane.
    closePane(session: Session): void {
        session.jobs.forEach(job => {
            job.removeAllListeners();
            job.interrupt();
        });
        session.removeAllListeners();

        const active = this.activePane;
        this._activePane = this.panes.previous(active);
        this.panes.remove(active);
    }

    closeAllPanes(): void {
        // Can't use forEach here because closePane changes the array being iterated.
        while (this.panes.size) {
            this.closePane(this.activePane.session);
        }
    }

    get activePane(): Pane {
        return this._activePane;
    }

    activatePane(pane: Pane): void {
        this._activePane = pane;
    }

    activatePreviousPane(): void {
        this._activePane = this.panes.previous(this.activePane);
    }

    activateNextPane(): void {
        this._activePane = this.panes.next(this.activePane);
    }

    updateAllPanesDimensions(): void {
        this.panes.forEach(pane => pane.session.dimensions = this.contentDimensions);
    }

    private get contentDimensions(): Dimensions {
        return {
            columns: Math.floor(this.contentSize.width / css.letterWidth),
            rows: Math.floor(this.contentSize.height / css.rowHeight),
        };
    }

    private get contentSize(): Size {
        return {
            width: window.innerWidth,
            height: window.innerHeight - css.titleBarHeight - css.infoPanelHeight - css.outputPadding,
        };
    }
}
