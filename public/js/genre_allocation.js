const app = new Vue({
	el: '#app',
	data: {
		characters: [],
		shows: [],
		characterFilter: '',
		showFilter: '',
		characterSelections: {},
		showSelections: {},
		showAllCharacters: false,
		showAllShows: false
	},
	template: `
		<div class="app">
			<section class="section" id="shows">
				<div class="container">
					<div class="level">
						<div class="level-left">
							<div class="intro">
								<h2 class="is-size-2 is-size-3-mobile">Shows</h2>
								<p>Find the shows you enjoyed the most and pick the category they fit best.</p>
							</div>
						</div>
						<div class="level-right">
							<div class="field is-grouped">
								<p class="control">
									<button :class="{button: true, 'is-link': showAllShows}" @click="showAllShows = !showAllShows">Show{{showAllShows ? 'ing' : ''}} All</button>
								</p>
								<p class="control">
									<input class="input" type="text" placeholder="Find a show..." v-model="showFilter">
								</p>
							</div>
						</div>
					</div>
					<show-list
						:shows="shows"
						:options="[
							'Action',
							'Adventure',
							'Comedy',
							'Drama',
							'Romance',
							'Slice of Life',
							'Thriller/Mystery',
							'Exclude'
						]"
						:filterText="showFilter"
						:showAll="showAllShows"
						v-model="showSelections"
					/>
				</div>
			</section>
		</div>
	`
});

fetch('/data/test.json').then(res => {
	console.log(res);
	return res.json();
}).then(({characters, shows}) => {
	console.log(characters, shows);
	app.characters = characters.sort((a, b) => a.terms[0].replace(/^\s*|\s*$/g, '').localeCompare(b.terms[0].replace(/^\s*|\s*$/g, '')));
	app.shows = shows.sort((a, b) => a.terms[0].replace(/^\s*|\s*$/g, '').localeCompare(b.terms[0].replace(/^\s*|\s*$/g, '')));
});
