import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

interface VideoCardProps {
  id: string;
  title: string;
  thumbnail: string;
  channelName: string;
  channelAvatar?: string;
  views: number;
  createdAt: string;
}

export const VideoCard = ({
  id,
  title,
  thumbnail,
  channelName,
  channelAvatar,
  views,
  createdAt,
}: VideoCardProps) => {
  const navigate = useNavigate();

  return (
    <div
      className="group cursor-pointer"
      onClick={() => navigate(`/watch?v=${id}`)}
    >
      <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
        <img
          src={thumbnail || "/placeholder.svg"}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        />
      </div>

      <div className="flex gap-3 mt-3">
        {channelAvatar && (
          <div className="flex-shrink-0">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-muted">
              <img
                src={channelAvatar}
                alt={channelName}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm line-clamp-2 mb-1">{title}</h3>
          <p className="text-xs text-muted-foreground">{channelName}</p>
          <p className="text-xs text-muted-foreground">
            {views.toLocaleString()} views •{" "}
            {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>
    </div>
  );
};
