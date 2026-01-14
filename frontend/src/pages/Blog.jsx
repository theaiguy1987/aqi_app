import { useState } from 'react'

const SAMPLE_POSTS = [
  {
    id: 1,
    title: "Understanding Air Pollution in India",
    date: "January 10, 2026",
    excerpt: "India faces significant air quality challenges, particularly in major cities. Understanding the causes and impacts is the first step toward solutions.",
    content: `Air pollution in India has reached critical levels in many urban areas. The problem is multifaceted, with sources ranging from vehicular emissions to industrial activity and agricultural burning.

Major metropolitan areas like Delhi, Mumbai, and Kolkata regularly experience air quality levels that exceed WHO guidelines by several times. During winter months, the situation often worsens due to temperature inversions that trap pollutants close to the ground.

The health impacts are severe. Respiratory diseases, cardiovascular problems, and reduced life expectancy are all linked to poor air quality. Children and the elderly are particularly vulnerable.

However, there is hope. Technological solutions, policy interventions, and increased public awareness are beginning to make a difference. Electric vehicles, stricter emission standards, and real-time air quality monitoring are part of the solution.

Individual actions matter too. Using public transport, reducing waste burning, and supporting clean energy initiatives all contribute to cleaner air.`,
    tags: ["Air Quality", "India", "Health"]
  },
  {
    id: 2,
    title: "The Winter Smog Crisis",
    date: "January 8, 2026",
    excerpt: "Every winter, North India faces severe smog episodes. Let's explore why this happens and what can be done.",
    content: `Winter in North India brings not just cold weather but also hazardous smog that blankets entire regions. This annual crisis is a combination of several factors.

First, the meteorological conditions during winter create what's called a temperature inversion. Normally, air temperature decreases with altitude, but during winter, a layer of warm air can trap cooler air near the ground. This acts like a lid, preventing pollutants from dispersing.

Second, agricultural burning in neighboring states adds massive amounts of particulate matter. Farmers burn crop residue to prepare fields for the next season, releasing enormous quantities of smoke.

Third, Diwali celebrations in October-November contribute to a spike in air pollution through firecracker usage, which coincides with the beginning of the unfavorable meteorological season.

Finally, increased use of heating systems, slower wind speeds, and continued vehicular and industrial emissions compound the problem.

Solutions require coordinated action:
- Mechanized alternatives to crop burning
- Stricter enforcement of firecracker bans
- Improved public transportation
- Regional cooperation on air quality management

The situation demands urgent action from policymakers, businesses, and citizens alike.`,
    tags: ["Winter", "Smog", "North India", "Agriculture"]
  },
  {
    id: 3,
    title: "Technology for Clean Air",
    date: "January 5, 2026",
    excerpt: "Innovative technologies are emerging to combat air pollution. From AI-powered monitoring to green infrastructure.",
    content: `Technology is playing an increasingly important role in the fight against air pollution in India. Here are some promising developments:

**Real-time Monitoring**: Networks of low-cost sensors are providing granular, real-time data on air quality. This helps citizens make informed decisions and enables authorities to respond quickly to pollution events.

**AI and Machine Learning**: Predictive models can forecast air quality levels days in advance, allowing for proactive measures like traffic restrictions or industrial controls.

**Electric Mobility**: The rapid adoption of electric vehicles, from two-wheelers to buses, is reducing tailpipe emissions in cities. Battery technology improvements are making EVs more accessible.

**Green Infrastructure**: Urban planning is incorporating more green spaces, which act as natural air filters. Vertical gardens and green roofs are becoming more common.

**Industrial Solutions**: Advanced filtration systems and cleaner production technologies are helping industries reduce their environmental footprint.

**Public Awareness Apps**: Mobile applications that provide real-time AQI data and health advisories are empowering citizens to protect themselves.

While technology alone cannot solve the air pollution crisis, it's an essential tool in our arsenal. Combined with policy changes and behavioral shifts, these innovations offer hope for cleaner air.`,
    tags: ["Technology", "Innovation", "Solutions"]
  }
]

export default function Blog() {
  const [selectedPost, setSelectedPost] = useState(null)

  if (selectedPost) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => setSelectedPost(null)}
              className="mb-6 inline-flex items-center gap-2 px-4 py-2 text-indigo-600 hover:text-indigo-800 font-medium bg-white rounded-lg shadow-sm hover:shadow transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to all posts
            </button>

            <article className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              <div className="h-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
              <div className="p-8 md:p-12">
                <header className="mb-8">
                  <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">
                    {selectedPost.title}
                  </h1>
                  <div className="flex items-center text-gray-500 mb-4">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium">{selectedPost.date}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedPost.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 rounded-full text-sm font-medium border border-indigo-100"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </header>

                <div className="prose prose-lg max-w-none">
                  {selectedPost.content.split('\n\n').map((paragraph, idx) => {
                    if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                      return (
                        <h3 key={idx} className="text-xl font-bold text-gray-800 mt-8 mb-3 flex items-center gap-2">
                          <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
                          {paragraph.replace(/\*\*/g, '')}
                        </h3>
                      )
                    }
                    return (
                      <p key={idx} className="text-gray-600 mb-4 leading-relaxed">
                        {paragraph}
                      </p>
                    )
                  })}
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-10">
      <div className="container mx-auto px-4">
        <header className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-3">
            Air Quality Insights
          </h1>
          <p className="text-gray-500 text-lg max-w-lg mx-auto">
            Analysis, research, and perspectives on India's air quality challenges
          </p>
        </header>

        <div className="max-w-4xl mx-auto space-y-5">
          {SAMPLE_POSTS.map((post, index) => (
            <article
              key={post.id}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all cursor-pointer overflow-hidden border border-gray-100 group"
              onClick={() => setSelectedPost(post)}
            >
              <div className="flex">
                <div className={`w-1.5 flex-shrink-0 bg-gradient-to-b ${
                  index === 0 ? 'from-red-400 to-orange-500' :
                  index === 1 ? 'from-blue-400 to-indigo-500' :
                  'from-emerald-400 to-teal-500'
                }`}></div>
                <div className="p-6 flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">
                      {post.title}
                    </h2>
                    <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center flex-shrink-0 ml-4 group-hover:bg-indigo-50 transition-colors">
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>

                  <div className="flex items-center text-gray-400 text-sm mb-3">
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {post.date}
                  </div>

                  <p className="text-gray-500 mb-4 leading-relaxed">
                    {post.excerpt}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 bg-gray-50 text-gray-600 rounded-lg text-xs font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="max-w-4xl mx-auto mt-12">
          <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-xl p-8 text-white text-center overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjYSkiLz48L3N2Zz4=')] opacity-50"></div>
            <div className="relative">
              <h3 className="text-2xl font-bold mb-3">Want to Share Your Thoughts?</h3>
              <p className="mb-5 opacity-90 max-w-md mx-auto">
                Have insights about air quality in India? We'd love to hear from you.
              </p>
              <button className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors shadow-lg">
                Contribute a Post
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
