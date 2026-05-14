import {XMLParser} from "fast-xml-parser";
import fs from "fs";
import {parseFile} from "music-metadata";
import {inspect} from "util";
import path from "path";
import {fileURLToPath} from "url";
import {sequelize} from "./models/index.js";
import {Track} from "./models/Track.ts";
import {Release} from "./models/Release.ts";
import {Artist} from "./models/Artist.ts";
import {Attribute, NotNull} from "@sequelize/core/decorators-legacy";
import {DataTypes} from "@sequelize/core";
import {normalizeString} from "./searchUtils.js";

let xml = fs.readFileSync("music/123456789012/metadata.xml", 'utf8');

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    removeNSPrefix: true,
    isArray: (name) => [
        'SoundRecording',
        'DisplayArtist',
        'Image',
        'Party',
        'Deal',
        'Genre',
        'ResourceGroupContentItem',
        'Release'
    ].includes(name)
});

const ddex = parser.parse(xml)
const ern = ddex.NewReleaseMessage

const resourceTrackMap = new Map();
const resourceImageMap = new Map();
const partyMap = new Map();

(ern.ResourceList?.SoundRecording || []).forEach(sr => {
    resourceTrackMap.set(sr.ResourceReference, sr)
});


(ern.ResourceList?.Image || []).forEach(image => {
    resourceImageMap.set(image.ResourceReference, image)
});


(ern.PartyList?.Party || []).forEach(party => {
    partyMap.set(party.PartyReference, party.PartyName.FullName)
});


const releases = ern.ReleaseList?.Release || [];

const artistsMap = new Map();

for (const r of releases) {
    const icpn = r.ReleaseId.ICPN.toString();
    const releaseType = r.ReleaseType;
    const releaseTitle = r.DisplayTitle?.TitleText || r.DisplayTitleText;
    const releaseTitleNormalized = normalizeString(releaseTitle)
    const releaseDisplayArtistName = r.DisplayArtistName;
    const releaseParentalWarning = r.ParentalWarningType;
    const releaseDate = new Date(r.ReleaseDate);

    await sequelize.transaction(async t => {
        const releaseLinkedResource = r.ResourceGroup.LinkedReleaseResourceReference

        const releaseCover = resourceImageMap.get(releaseLinkedResource)

        const releaseCoverTech = releaseCover.TechnicalDetails;
        const releaseCoverFile = releaseCoverTech?.DeliveryFile;
        const releaseCoverURI = releaseCoverFile?.File?.URI;

        const [release, created] = await Release.upsert({
            icpn,
            type: releaseType,
            title: releaseTitle,
            titleNormalized: releaseTitleNormalized,
            artist: releaseDisplayArtistName,
            date: releaseDate,
            cover: `${icpn}/${releaseCoverURI}`,
            parentalWarning: releaseParentalWarning,
        }, { transaction: t });

        for (const { ArtistPartyReference } of r.DisplayArtist) {
            const [artist, _] = await Artist.upsert({
                name: partyMap.get(ArtistPartyReference),
                nameNormalized: normalizeString(partyMap.get(ArtistPartyReference))
            }, {transaction: t });

            artistsMap.set(
                ArtistPartyReference,
                artist
            )

            await artist.addRelease(release, {transaction: t });
        }

        const contentItems = r.ResourceGroup.ResourceGroupContentItem || [];

        for (const contentItem of contentItems) {
            const audioRef = contentItem.ResourceReference;
            const coverRef = contentItem.LinkedReleaseResourceReference || releaseLinkedResource;

            const audio = resourceTrackMap.get(audioRef);
            const cover = resourceImageMap.get(coverRef);

            const isrc = audio.SoundRecordingEdition?.ResourceId?.ISRC;
            const title = audio.DisplayTitle?.TitleText || audio.DisplayTitleText;
            const titleNormalized = normalizeString(title);
            const displayArtist = audio.DisplayArtistName;
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

            const [track, _] = await Track.upsert({
                isrc,
                releaseId: release.id,
                title,
                artist: displayArtist,
                titleNormalized,
                duration,
                parentalWarning,
                uri: `${icpn}/${audioURI}`,
                cover: `${icpn}/${coverURI}`,
            }, { transaction: t });

            await release.addTrack(track, { transaction: t });

            for (const { ArtistPartyReference } of audio.DisplayArtist) {
                await artistsMap.get(ArtistPartyReference).addTrack(track, { transaction: t });
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

