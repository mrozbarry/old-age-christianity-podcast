import { promises as fs, readFileSync } from 'fs';
import path from 'path';
import Podcast from 'podcast';
import pug from 'pug';

import meta from '../data/meta.json';
import episodes from '../data/episodes.json';

const rootPath = path.resolve(__dirname, '..');
const publicPath = (f = '') => path.join(rootPath, 'public', f);
const srcPath = (...f) => path.join(rootPath, 'src', ...f);

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const toPubDate = (dateStr) => {
  const date = new Date(dateStr);

  return [date.getDate(), months[date.getMonth()], date.getFullYear()].join(' ');
};

const urlGenerator = (base) => (uri) => `${base}/${uri}`;

const webUrl = urlGenerator('https://oldagechristianity.com');
const dumpUrl = urlGenerator('https://dump.mrbarry.com');

const feed = new Podcast({
  title: meta.title,
  description: meta.description,
  feed_url: webUrl('rss.xml'),
  site_url: webUrl(''),
  image_url: dumpUrl(meta.imagePath),
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
  itunesImage: dumpUrl(meta.imagePath),
});

const makeEpisode = (episode) => ({
  title: episode.title,
  description: episode.description,
  url: dumpUrl(episode.storagePath),
  categories: episode.categories,
  author: episode.author || meta.author,
  date: episode.date,
  itunesAuthor: episode.author || meta.author,
  itunesExplicit: false,
  itunesSummary: episode.description,
  itunesNewsFeedUrl: webUrl('rss.xml'),
  enclosure: {
    url: dumpUrl(episode.storagePath),
  },
  content: dumpUrl(episode.storagePath),
});

episodes
  .map(makeEpisode)
  .forEach((episode) => {
    feed.addItem(episode)
  });

const webEpisodes = episodes.map((data, index) => ({
  ...makeEpisode(data),
  episodeNumber: index + 1,
})).reverse();

const pugFn= pug.compileFile(srcPath('pages', 'index.pug'));
const html = pugFn({
  episodes: webEpisodes,
});

Promise.all([
  fs.writeFile(
    publicPath('rss.xml'),
    feed.buildXml(),
    'utf8'
  ),

  fs.writeFile(
    publicPath('index.html'),
    html,
    'utf8',
  ),
])
  .then(() => console.log('rss+html built'))
  .catch((err) => {
    console.error('unable to build rss+html');
    console.error(err);
    return -1;
  })
  .then((exitCode = 0) => (
    process.exit(exitCode)
  ));
