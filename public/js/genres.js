const app = new Vue({
	el: '#app',
	data: {
		selectedTab: 'Action',
		shows: [],
		filter: '',
		selections: JSON.parse(showsJSON).data || {},
		showAll: false,
		saveButtonText: 'Save Selections',
		changesSinceSave: false,
	},
	computed: {
		_filteredShows () {
			return this.shows.filter(show => stringMatchesArray(this.filter, show.terms));
		},
		filteredShows () {
			return this.showAll ? this._filteredShows : this._filteredShows.slice(0, 10);
		},
		moreItems () {
			return this._filteredShows.length - this.filteredShows.length;
		}
	},
	template: `
		<div class="app">
			<div class="hero is-dark">
				<div class="hero-body">
					<div class="container">
						<h2 class="title is-size-1 is-size-2-mobile">Genre Awards</h2>
						<p class="subtitle is-size-4 is-size-5-mobile">Pick the shows in each genre grouping below that stood above the rest this year.</p>
					</div>
				</div>
				<div class="hero-foot">
					<div class="container">
						<tab-bar
							:tabs="[
								'Action',
								'Adventure',
								'Comedy',
								'Drama',
								'Romance',
								'Slice of Life',
								'Thriller/Mystery'
							]"
							v-model="selectedTab"
						/>
					</div>
				</div>
			</div>
			<section class="section" id="shows">
				<div class="container">
					<div class="level">
						<div class="level-left">
							<div class="intro">
								<h2 class="is-size-2 is-size-3-mobile">Shows</h2>
							</div>
						</div>
						<div class="level-right">
							<div class="field is-grouped">
								<p class="control">
									<button :class="{button: true, 'is-link': showAll}" @click="showAll = !showAll">
										Show{{showAll ? 'ing' : ''}} All
									</button>
								</p>
								<p class="control is-expanded">
									<input class="input" type="text" placeholder="Find a show..." v-model="filter">
								</p>
							</div>
						</div>
					</div>
					<div class="card media-list">
						<show-display
							v-for="show in filteredShows"
							:key="show.id"
							:show="show"
							:checked="selections[show.id] === selectedTab"
							@click.native="setShow(show.id, selectedTab)"
						/>
						<div class="more-items" v-if="moreItems">
							<p class="has-text-centered" style="flex: 1 1 100%">
								And <b>{{moreItems}}</b> more (<a @click="$root.showAll = true">Show all</a>)
							</p>
						</div>
					</div>
				</div>
			</section>
			<div class="save-footer">
				<button class="button is-success save-button" @click="save">{{saveButtonText}}</button>
			</div>
		</div>
	`,
	watch: {
		selections: {
			handler () {
				this.changesSinceSave = true
			},
			deep: true
		},
	},
	methods: {
		setShow (id, category) {
			console.log('saa')
			if (this.selections[id] === category) {
				Vue.set(this.selections, id, null);
			} else if (!this.selections[id] || confirm(`You have already selected this show for the ${this.selections[id]} category. You can only nominate a show for one category. Would you like to change it to ${category}?`)) {
				Vue.set(this.selections, id, category);
			}
		},
		save () {
			this.saveButtonText = "Saving..."
			submit('/response/genres', {
				data: this.selections
			}).then(() => {
				this.changesSinceSave = false;
				this.saveButtonText = "Saved!"
				setTimeout(() => {
					this.saveButtonText = "Save Selections"
				}, 1500)
			}).catch(() => {
				this.saveButtonText = "Save Selections"
				alert('Failed to save, try again')
			});
		}
	}
});

window.onbeforeunload = function () {
	if (app.changesSinceSave) return "You have unsaved selections. Leave without saving?"
}

fetch('/data/test.json').then(res => {
	console.log(res);
	return res.json();
}).then(({characters, shows}) => {
	console.log(characters, shows);
	app.characters = characters.sort((a, b) => a.terms[0].replace(/^\s*|\s*$/g, '').localeCompare(b.terms[0].replace(/^\s*|\s*$/g, '')));
	app.shows = shows.sort((a, b) => a.terms[0].replace(/^\s*|\s*$/g, '').localeCompare(b.terms[0].replace(/^\s*|\s*$/g, '')));
});
