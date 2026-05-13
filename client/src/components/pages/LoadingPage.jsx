import {Disc3} from "lucide-react";
import "./LoadingPage.css"

export const LoadingPage = () => {
    return (
        <div className="loading">
            <Disc3 className="loadIcon spin" size={100} stroke={"white"}/>
        </div>
    )
}