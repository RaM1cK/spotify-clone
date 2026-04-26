import {XMLParser} from "fast-xml-parser";
import fs from "fs";
import {parseFile} from "music-metadata";
import {inspect} from "util";
import path from "path";
import {fileURLToPath} from "url";
import {sequelize} from "./models/index.js";
import {Track} from "./models/Track.ts";
import {Release} from "./models/Release.ts";

let xml = fs.readFileSync("music/123456789012/metadata.xml", 'utf8');

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    removeNSPrefix: true,
    isArray: (name) => [
        'SoundRecording',
        'Image',
        'Party',
        'Deal',
        'Genre',
        'ResourceGroup',
        'ResourceGroupContentItem',
        'Release'
    ].includes(name)
});

const ddex = parser.parse(xml)
const ern = ddex.NewReleaseMessage

const resourceMap = new Map();

(ern.ResourceList?.SoundRecording || []).forEach(sr => {
    resourceMap.set(sr.ResourceReference, sr)
});


(ern.ResourceList?.Image || []).forEach(image => {
    resourceMap.set(image.ResourceReference, image)
});

const releases = ern.ReleaseList?.Release || [];

for (const r of releases) {
    const icpn = r.ReleaseId.ICPN.toString();
    const releaseType = r.ReleaseType;
    const releaseTitle = r.DisplayTitle?.TitleText || r.DisplayTitleText;
    const releaseArtist = r.DisplayArtistName;
    const releaseParentalWarning = r.ParentalWarningType;

    await sequelize.transaction(async t => {
        const [release, created] = await Release.upsert({
            icpn,
            type: releaseType,
            title: releaseTitle,
            artist: releaseArtist,
            parentalWarning: releaseParentalWarning,
        }, { transaction: t });

        const resourceGroups = r.ResourceGroup || [];
        for (const group of resourceGroups) {
            const contentItems = group.ResourceGroupContentItem || [];
            for (const contentItem of contentItems) {
                const audioRef = contentItem.ReleaseResourceReference;
                const coverRef = contentItem.LinkedReleaseResourceReference;

                const audio = resourceMap.get(audioRef);
                const cover = resourceMap.get(coverRef);

                const isrc = audio.SoundRecordingEdition?.ResourceId?.ISRC;
                const title = audio.DisplayTitle?.TitleText || audio.DisplayTitleText;
                const artist = audio.DisplayArtistName;
                const parentalWarning = audio.ParentalWarningType;

                const durationPattern = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?/;
                const matchDuration = audio.Duration.match(durationPattern);
                const hours = parseInt(matchDuration?.[1] || '0');
                const minutes = parseInt(matchDuration?.[2] || '0');
                const seconds = parseFloat(matchDuration?.[3] || '0');
                const duration = hours * 3600 + minutes * 60 + seconds;

                const audioTech = audio.TechnicalDetails;
                const audioFile = audioTech?.DeliveryFile;
                const audioURI = audioFile?.File?.URI;

                const coverTech = cover.TechnicalDetails;
                const coverFile = coverTech?.DeliveryFile;
                const coverURI = coverFile?.File?.URI;

                const [track] = await Track.upsert({
                    isrc,
                    releaseId: release.id,
                    title,
                    artist,
                    duration,
                    parentalWarning,
                    uri: audioURI,
                    cover: coverURI,
                }, { transaction: t });

                await release.addTrack(track, { transaction: t });
            }
        }
    });
}

// const tracks = ern.ResourceList?.SoundRecording || []
// console.log(tracks)

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
//
// const metadata = await parseFile(path.join(__dirname, '/music/123456789012/resources/morgenshtern-cvetok-(allmusic.kz).mp3'))
// console.log(inspect(metadata, {showHidden: false, depth: null}));

