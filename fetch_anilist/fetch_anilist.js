const fs = require('fs');
const superagent = require('superagent');

const showsQuery = fs.readFileSync('queries/shows.gql', 'utf-8');
const showCharactersQuery = fs.readFileSync('queries/showCharacters.gql', 'utf-8');

const allShows = [];
const allCharacters = [];

function sleep (ms) {
	return new Promise(resolve => {
		setTimeout(resolve, ms);
	});
}

async function anilistRequest (query, variables = {}) {
	try {
		const res = await superagent.post('https://graphql.anilist.co')
			.type('application/json')
			.accept('application/json')
			.ok(() => true) // Don't reject on 4xx/5xx headers
			.send({query, variables});
		console.log(`Made request, ${res.header['x-ratelimit-remaining']} left in the next ${parseInt(res.header['x-ratelimit-reset'], 10) - Math.floor(Date.now() / 1000)} seconds`);
		const retryAfter = res.header['retry-after'];
		if (retryAfter) {
			console.log(`=== Ratelimited, retrying in ${retryAfter} seconds ===`);
			await sleep(retryAfter * 1000);
			return await anilistRequest(query, variables);
		}
		return res;
	} catch (res) {
		console.log(res.status, res);
		process.exit(1);
	}
}

async function getShows (page = 1) {
	const res = await anilistRequest(showsQuery, {page});
	const {pageInfo, media} = res.body.data.Page;
	console.log(`Got shows page ${page} (${Math.min(pageInfo.perPage * page, pageInfo.total)} of ${pageInfo.total})`);

	// Loop over all the shows we got...
	for (const show of media) {
		// Push each show's information to the database
		allShows.push({
			id: show.id,
			terms: [
				show.title.romaji,
				show.title.english,
				show.title.native,
				...show.synonyms
			].filter(s => s),
			img: show.coverImage.medium,
			format: show.format
		});
		// Start getting characters from that show
		await getShowCharacters(show.id);
	}

	// If there's more shows, get more shows
	if (pageInfo.hasNextPage) {
		await getShows(page + 1);
	}
}

async function getShowCharacters (showId, page = 1) {
	const res = await anilistRequest(showCharactersQuery, {showId, page});
	const {pageInfo, nodes} = res.body.data.Media.characters;
	console.log(`Got characters page ${page} for show ${showId} (${Math.min(pageInfo.perPage * page, pageInfo.total)} of ${pageInfo.total})`);

	// For all the characters we just got, push their info to the characters array
	for (const character of nodes) {
		// If we've already registered this character, just add a second show for them
		const index = allCharacters.findIndex(existingChar => existingChar.id === character.id);
		if (index !== -1) {
			allCharacters[index].showIds.push(showId);
			continue;
		}
		// Otherwise, construct a new character thingy
		const englishName = [
			character.name.first,
			character.name.last
		].filter(s => s).join(' ');
		allCharacters.push({
			showIds: [showId],
			id: character.id,
			terms: [
				englishName,
				character.name.native,
				...character.name.alternative
			].filter(s => s),
			img: character.image.medium
		});
	}

	// If there's more characters for this show, get them too
	if (pageInfo.hasNextPage) {
		await getShowCharacters(showId, page + 1);
	}
}

const start = Date.now();
getShows().then(() => {
	const finished = Date.now() - start;
	console.log(`Finished scraping in ${finished} ms`);
	fs.writeFileSync('../public/data/test.json', JSON.stringify({
		shows: allShows,
		characters: allCharacters
	}, null, '\t'), 'utf-8');
	console.log('Done');
	process.exit(0);
});
