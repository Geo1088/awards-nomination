require "json"
require "httparty"

SHOWS_QUERY = File.read "queries/shows.gql"
CHARS_QUERY = File.read "queries/show_characters.gql"
SINGLE_SHOW_QUERY = File.read "queries/single_show.gql"
MODIFICATIONS = JSON.parse File.read "edited_shows.json"

def anilist_request(query, variables = {})
  # Make the request
  res = HTTParty.post "https://graphql.anilist.co", headers: {
    "Content-Type" => "application/json",
    "Accept" => "application/json"
  }, body: {
    query: query,
    variables: variables
  }.to_json

  # Handle ratelimits for future requests
  if res.headers["retry-after"]
    puts "   Ratelimited, retrying"
    sleep res.headers["retry-after"].to_i + 1
    anilist_request query, variables
  else
    res
  end
end

@shows = []
@opedOnly = []
@characters = []
@vas = []

def get_shows(page: 1)
  puts "Shows page #{page}"
  res = anilist_request SHOWS_QUERY, page: page
  data = JSON.parse(res.body)["data"]["Page"]
  page_info = data["pageInfo"]
  media = data["media"]
  total = page_info["total"]

  puts "Found #{total} shows."
  p page_info
  media.each.with_index 1 do |show, i|
    puts "#{page}-#{i} Show #{show["id"]}"
    if MODIFICATIONS["removed"].include? show["id"]
      puts " Skipping, inelligible"
      next
    end
    movie = MODIFICATIONS["movies"].include? show["id"]
    puts " Updating format to MOVIE (manual override)" if movie
    @shows.push({
      id: show["id"],
      mal: show["idMal"],
      terms: show["title"].values.concat(show["synonyms"]),
      img: show["coverImage"]["medium"],
      format: movie ? "MOVIE" : show["format"],
      short: MODIFICATIONS["shorts"].include?(show["id"]),
      original: MODIFICATIONS["originals"].include?(show["id"])
    })
    get_show_characters show["id"] if show["characters"]["edges"].size > 0
  end

  get_shows(page: page + 1) if page_info["hasNextPage"]
end

def get_show_characters(show_id, page: 1)
  res = anilist_request CHARS_QUERY, page: page, showId: show_id
  data = JSON.parse(res.body)["data"]["Media"]["characters"]
  page_info = data["pageInfo"]
  edges = data["edges"]

  edges.each do |edge|
    character = edge["node"]
    i = @characters.index { |c| c[:id] == character["id"]}
    unless i.nil?
      @characters[i][:show_ids].push show_id
      next
    end

    english_name = [
      character["name"]["first"],
      character["name"]["last"]
    ].reject(&:nil?).join " "
    @characters.push({
      id: character["id"],
      show_ids: [show_id],
      terms: [
        english_name,
        character["name"]["native"],
        *character["name"]["alternative"]
      ].select {|s| s},
      img: character["image"]["medium"]
    })

    vas = edge["voiceActors"]
    vas.each do |va|
      puts " VA #{va["id"]} for character #{character["id"]}"
      english_va_name = [
        va["name"]["first"],
        va["name"]["last"]
      ].reject(&:nil?).join " "
      @vas.push({
        id: va["id"],
        name: english_va_name,
        image: va["image"]["medium"],
        show: show_id,
        character: character["id"]
      })
    end
  end

  get_show_characters show_id, page: page + 1 if page_info["hasNextPage"]
end

def get_extra_show(show_id)
  res = anilist_request SINGLE_SHOW_QUERY, showId: show_id
  show = JSON.parse(res.body)["data"]["Media"]

  puts "Found show #{show_id}."
  hash = {
    id: show_id,
    mal: show["idMal"],
    terms: show["title"].values.concat(show["synonyms"]),
    img: show["coverImage"]["medium"],
    format: "TV",
    short: false,
    original: MODIFICATIONS["originals"].include?(show["id"])
  }
  @shows.push hash
  get_show_characters show_id if show["characters"]["edges"].size > 0
end

puts "Starting"
start = Time.now
puts "Getting additional shows"
MODIFICATIONS["added"].each do |show_id|
  get_extra_show show_id
end
time = Time.now - start
puts "Finished in #{time}ms"
File.write "../public/data/test3.json", {
  shows: @shows.uniq {|s| s[:id]},
  characters: @characters.uniq {|s| s[:id]},
  vas: @vas.uniq {|s| "#{s[:id]}-#{s[:show]}-#{s[:character]}"},
  opedOnly: @opedOnly.uniq {|s| s[:id]}
}.to_json
