import io from 'socket.io-client';
import React, {useEffect, useState} from "react";
import Player from "./components/UI/Player/Player";
import {Button, Nav, NavLink} from "react-bootstrap";
import {CircleUserRound, ListMusic, MessageCircleMore} from 'lucide-react'
import axios from "axios";
import "./App.css";
import TrackList from "./components/UI/TrackList/TrackList";
import {Track} from "./classes/models/Track.ts";

// const socket = io("http://localhost:8080");

function App() {
    const music = [
        "morgenshtern-cvetok-(allmusic.kz).mp3",
        "Jane_Remover_-_Dancing_with_your_eyes_closed_80039450.mp3"
    ]

    const [trackList, setTrackList] = useState([]);

    const getTrack = async (trackName) => {
        try {
            const res =  await axios.post('http://localhost:8080/tracks/getTrack/' + trackName)

            return res.data;
        } catch (error) {
            console.error(error);
            return null;
        }


    }

    // const first = new Track({
    //     id: '1',
    //     logoURL: 'https://t2.genius.com/unsafe/184x184/https%3A%2F%2Fimages.genius.com%2F76714eccf8df6ec9924514712f9cdd15.1000x1000x1.png',
    //     name: 'Цветок',
    //     creator: 'Моргенштерн',
    //     url: music[0],
    //     duration: 155
    // })
    // //
    // const second = new Track({
    //     id: '2',
    //     logoURL: 'https://t2.genius.com/unsafe/184x184/https%3A%2F%2Fimages.genius.com%2Fdfc77405bb4b0bdc013dba5e348b1553.1000x1000x1.png',
    //     name: 'Dancing with your eyes closed',
    //     creator: 'Jane Remover',
    //     url: music[1],
    //     duration: 230
    // })

    useEffect(() => {
        (async () => {
            const tracks = await Promise.all(music.map(async name => {
                return await getTrack(name);
            }));
            setTrackList(tracks.filter(track => track !== null));
        })();
    }, []);

    //
    //
    // const getHome = async () => {
    //     const home = await axios.post("http://localhost:8080/home");
    //
    //     console.log(home.data);
    // }

  return (
      <>
          <div
              className="d-flex flex-row"
              style={{
                  minHeight: '100vh'
              }}
          >
              <Nav
                  className="d-flex flex-column justify-content-start"
                  style={{
                      position: "sticky",
                      top: '0',
                      height: '100%',
                  }}
              >
                  <NavLink>
                      <CircleUserRound />
                  </NavLink>
                  <NavLink>
                      <ListMusic />
                  </NavLink>
                  <NavLink>
                      <MessageCircleMore />
                  </NavLink>
              </Nav>

              <div
                  className="d-flex flex-column"
                  style={{
                      width: "100%",
                      height: '100%',
                    }}
              >
                  {/*<Button onClick={getHome}>click</Button>*/}

                  {/*<TrackItem Track={first}/>*/}
                  {/*<TrackItem Track={second}/>*/}

                  <TrackList tracks={trackList}/>
                  {/*<Button onClick={*/}
                  {/*    async () => {*/}
                  {/*        await getTrack(music[0])*/}
                  {/*    }*/}
                  {/*}>*/}
                  {/*    Добавить трек*/}
                  {/*</Button>*/}
              </div>
          </div>
          <Player/>
      </>
  );
}

export default App;
