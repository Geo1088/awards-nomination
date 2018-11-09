require "yaml"
require "sinatra"
require "redd/middleware"

CONFIG = YAML.load_file "config.yaml"

use Rack::Session::Cookie
use Redd::Middleware, CONFIG.merge({
  user_agent: "web:github.com/Geo1088/awards-nomination:v1.0.0 (by /u/geo1088)",
  via: "/auth/reddit",
  redirect_uri: "#{CONFIG[:host]}/auth/reddit/callback",
  scope: ["identity"]
})

set :bind, "0.0.0.0"
set :port, ENV["PORT"] || 4567

before do
  @r = request.env["redd.session"]
  begin
    @r.me.name
  rescue
    @r = nil
  end
end

helpers do
  def h(text)
    Rack::Utils.escape_html(text)
  end

  def authenticate!
    redirect to "/" unless @r
  end
end

get "/" do
  redirect_to "/form" if @r
  erb :index
end

# Auth stuff
get "/login" do redirect to "/auth/reddit" end
get "/auth/reddit/callback" do
  redirect to "/" unless request.env["redd.error"]
  erb :error, locals: {error: request.env["redd.error"]}
end
get "/logout" do
  request.env["redd.session"] = nil
  redirect to "/"
end

get "/form" do
  authenticate!
  erb :form
end
