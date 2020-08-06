import { promises as fs, readFileSync } from 'fs';
import path from 'path';
import Podcast from 'podcast';

import meta from '../data/meta.json';
import episodes from '../data/episodes.json';

const rootPath = path.resolve(__dirname, '..');
const publicPath = (f = '') => path.join(rootPath, 'public', f);
const dataPath = (f) => path.join(rootPath, 'data', f);

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const toPubDate = (dateStr) => {
  const date = new Date(dateStr);

  return [date.getDate(), months[date.getMonth()], date.getFullYear()].join(' ');
};

const urlGenerator = (base) => (uri) => `${base}/${uri}`;

const webUrl = urlGenerator('https://oldagechristianity.com');
const storageUrl = urlGenerator('https://firebasestorage.googleapis.com/v0/b/podcast-18b82.appspot.com/o');

const feed = new Podcast({
  title: meta.title,
  description: meta.description,
  feed_url: webUrl('rss.xml'),
  site_url: webUrl(''),
  image_url: webUrl('img/logo-transparent.jpg'),
  author: meta.author,
  managingEditor: meta.editor,
  webMaster: meta.webMaster,
  copyright: meta.copyright,
  language: 'en',
  categories: meta.categories,
  pubDate: toPubDate('2020-07-24'),
  ttl: '60',
  itunesAuthor: meta.author,
  itunesSummary: meta.description,
  itunesOwner: {
    name: meta.author,
    email: meta.email,
  },
  itunesExplicit: false,
  itunesCategory: [
    {
      text: meta.itunes.category,
      subcats: meta.itunes.subcategories
        .map((text) => ({ text })),
    },
  ],
  itunesImage: webUrl('img/logo-transparent.jpg'),
});

const makeEpisode = (episode) => ({
  title: episode.title,
  description: episode.description,
  url: storageUrl(episode.storagePath + '?alt=media'),
  categories: episode.categories,
  author: episode.author || meta.author,
  date: episode.date,
  itunesAuthor: episode.author || meta.author,
  itunesExplicit: false,
  itunesSummary: episode.description,
  itunesNewsFeedUrl: webUrl('rss.xml'),
  enclosure: {
    url: storageUrl(episode.storagePath + '?alt=media'),
  },
  content: storageUrl(episode.storagePath + '?alt=media'),
});

const html = {
  head: readFileSync(dataPath('head.html'), 'utf8').replace('{{description}}', meta.description),
  foot: readFileSync(dataPath('foot.html'), 'utf8'),
  episodeTemplate: readFileSync(dataPath('episode.html'), 'utf8'),
  episodes: [],
};

const assembleEpisode  = (episode, index) => html.episodeTemplate
  .replace('{{episode_number}}', index + 1)
  .replace('{{title}}', episode.title)
  .replace('{{description}}', episode.description)
  .replace('{{audio_url}}', episode.url)
  .replace('{{tags}}', [
    episode.title,
    episode.url,
    ...episode.categories,
  ].join(','))

episodes
  .map(makeEpisode)
  .forEach((episode, index) => {
    feed.addItem(episode)
    html.episodes = [
      assembleEpisode(episode, index),
      ...html.episodes,
    ];
  });

Promise.all([
  fs.writeFile(
    publicPath('rss.xml'),
    feed.buildXml(),
    'utf8'
  ),
  fs.writeFile(
    publicPath('index.html'),
    `${html.head}
${html.episodes.join("\n")}
${html.foot}`,
  ),
])
  .then(() => console.log('rss built'))
  .catch((err) => {
    console.error('unable to build rss');
    console.error(err);
    return -1;
  })
  .then((exitCode = 0) => (
    process.exit(exitCode)
  ));
