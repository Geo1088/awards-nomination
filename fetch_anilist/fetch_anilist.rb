require "json"
require "httparty"

SHOWS_QUERY = File.read "queries/shows.gql"
CHARS_QUERY = File.read "queries/show_characters.gql"

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
  resets_in = res.headers["x-ratelimit-reset"].to_i - Time.now.to_i
  if res.headers["retry-after"]
    puts "   Ratelimited, retrying"
    sleep res.headers["retry-after"].to_i + 1
    anilist_request query, variables
  else
    res
  end
end

@shows = []
@characters = []

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
    @shows.push({
      id: show["id"],
      terms: show["title"].values.concat(show["synonyms"]),
      img: show["coverImage"]["medium"],
      format: show["format"]
    })
    get_show_characters show["id"] if show["characters"]["edges"].size > 0
  end

  get_shows(page: page + 1) if page_info["hasNextPage"]
end

def get_show_characters(show_id, page: 1)
  res = anilist_request CHARS_QUERY, page: page, showId: show_id
  data = JSON.parse(res.body)["data"]["Media"]["characters"]
  page_info = data["pageInfo"]
  nodes = data["nodes"]

  nodes.each do |character|
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
  end

  get_show_characters show_id, page: page + 1 if page_info["hasNextPage"]
end

puts "Starting"
start = Time.now
get_shows
time = Time.now - start
puts "Finished in #{time}ms"
File.write "../public/data/test2.json", {
  shows: @shows,
  characters: @characters
}.to_json
