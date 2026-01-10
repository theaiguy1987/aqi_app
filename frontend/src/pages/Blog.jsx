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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => setSelectedPost(null)}
              className="mb-6 text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to all posts
            </button>

            <article className="bg-white rounded-lg shadow-lg p-8 md:p-12">
              <header className="mb-8">
                <h1 className="text-4xl font-bold text-gray-800 mb-4">
                  {selectedPost.title}
                </h1>
                <div className="flex items-center text-gray-600 mb-4">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {selectedPost.date}
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedPost.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
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
                      <h3 key={idx} className="text-xl font-semibold text-gray-800 mt-6 mb-3">
                        {paragraph.replace(/\*\*/g, '')}
                      </h3>
                    )
                  }
                  return (
                    <p key={idx} className="text-gray-700 mb-4 leading-relaxed">
                      {paragraph}
                    </p>
                  )
                })}
              </div>
            </article>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-3">
            Thoughts on Air Pollution in India
          </h1>
          <p className="text-gray-600 text-lg">
            Insights, analysis, and perspectives on India's air quality challenges
          </p>
        </header>

        <div className="max-w-4xl mx-auto space-y-6">
          {SAMPLE_POSTS.map((post) => (
            <article
              key={post.id}
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => setSelectedPost(post)}
            >
              <div className="flex items-start justify-between mb-3">
                <h2 className="text-2xl font-bold text-gray-800 hover:text-indigo-600 transition-colors">
                  {post.title}
                </h2>
                <svg className="w-6 h-6 text-gray-400 flex-shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>

              <div className="flex items-center text-gray-500 text-sm mb-3">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {post.date}
              </div>

              <p className="text-gray-600 mb-4 leading-relaxed">
                {post.excerpt}
              </p>

              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="max-w-4xl mx-auto mt-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-3">Want to Share Your Thoughts?</h3>
          <p className="mb-4 opacity-90">
            Have insights about air pollution in India? We'd love to hear from you.
          </p>
          <button className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            Contribute a Post
          </button>
        </div>
      </div>
    </div>
  )
}
