const app = new Vue({
	el: '#app',
	data: {
		selectedTab: 'Action',
		shows: [],
		filter: '',
		selections: JSON.parse(showsJSON).data || {},
		showSelected: false,
		saveButtonText: 'Save Selections',
		changesSinceSave: false,
	},
	computed: {
		_filteredShows () {
			return this.shows.filter(show => stringMatchesArray(this.filter, show.terms))
				.filter(show => show.format !== 'MUSIC')
				.filter(show => this.showSelected ? this.selections[show.id] === this.selectedTab : true);
		},
		filteredShows () {
			return this.showSelected ? this._filteredShows : this._filteredShows.slice(0, 50);
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
								'Adventure/Fantasy',
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
								<h2 class="is-size-2 is-size-3-mobile">{{selectedTab}}</h2>
							</div>
						</div>
						<div class="level-right">
							<div class="field is-grouped">
								<p class="control">
									<button :class="{button: true, 'is-link': showSelected}" @click="showSelected = !showSelected">
										Show{{showSelected ? 'ing' : ''}} Selected
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
								And <b>{{moreItems}}</b> more (Use the search box to filter)
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
	return res.json();
}).then(({shows}) => {
	app.shows = shuffle(shows);
});
